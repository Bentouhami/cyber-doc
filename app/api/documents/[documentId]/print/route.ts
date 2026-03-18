import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";
import { incrementDailyStats } from "@/services/dailyStatsService";

const printSchema = z.object({
  printerId: z.string().optional(),
  printerName: z.string().optional(),
  copies: z.number().int().min(1).optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;

  const isEmployee = hasAnyRole(currentUser, ["employee", "admin"]);
  if (!isEmployee) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: z.infer<typeof printSchema>;
  try {
    const body = await request.json();
    const parsed = printSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    data = parsed.data;
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  const { documentId } = await params;
  const copies = data.copies ?? 1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.findUnique({
        where: { id: documentId },
        include: { template: { include: { documentType: true, category: true } } },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const printedStatus = await tx.documentStatus.findFirst({
        where: { name: "PRINTED" },
      });

      let printer = data.printerId
        ? await tx.printer.findUnique({ where: { id: data.printerId } })
        : null;

      if (!printer) {
        printer = await tx.printer.findFirst({ where: { isActive: true } });
      }

      if (!printer) {
        throw new Error("No active printer configured");
      }

      const history = await tx.printHistory.create({
        data: {
          documentId: document.id,
          printedById: currentUser.id,
          copies,
          printerId: printer.id,
          printerName: data.printerName ?? printer.name ?? null,
        },
      });

      await tx.document.update({
        where: { id: document.id },
        data: {
          statusId: printedStatus?.id ?? document.statusId,
          totalCopies: document.totalCopies + copies,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUser.id,
          activityType: { connect: { name: "PRINT_DOCUMENT" } },
          resourceType: "Document",
          resourceId: document.id,
        },
      });

      await incrementDailyStats(tx, new Date(), {
        documentsPrinted: 1,
        totalCopies: copies,
        topDocumentType: document.template.documentType.name,
        topCategory: document.template.category.name,
      });

      return { documentId: document.id, historyId: history.id };
    });

    return NextResponse.json({
      message: "Document printed",
      documentId: result.documentId,
      printHistoryId: result.historyId,
    });
  } catch (error) {
    console.error("Error printing document:", error);
    const message = error instanceof Error ? error.message : "Print failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
