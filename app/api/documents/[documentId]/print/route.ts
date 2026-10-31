import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import { calculatePaymentState } from "@/lib/payment-policy";
import { lockDocumentForUpdate } from "@/lib/document-transaction-lock";
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
    logApiError(
      { route: "/api/documents/[documentId]/print", operation: "parse_request" },
      error,
    );
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  const { documentId } = await params;
  const copies = data.copies ?? 1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (!(await lockDocumentForUpdate(tx, documentId))) {
        return { kind: "not-found" } as const;
      }
      const document = await tx.document.findUnique({
        where: { id: documentId },
        include: { template: { include: { documentType: true, category: true } } },
      });

      if (!document) return { kind: "not-found" } as const;

      const printedStatus = await tx.documentStatus.findFirst({
        where: { name: "PRINTED" },
      });
      const printDocumentActivity = await tx.activityType.findFirst({
        where: { name: "PRINT_DOCUMENT" },
        select: { id: true },
      });
      if (!printDocumentActivity) {
        throw new Error("Required PRINT_DOCUMENT activity type is missing");
      }

      let printer = data.printerId
        ? await tx.printer.findFirst({
            where: { id: data.printerId, isActive: true },
          })
        : null;

      if (data.printerId && !printer) {
        return { kind: "invalid-printer" } as const;
      }

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

      const nextTotalCopies = document.totalCopies + copies;
      const hasPrice =
        document.unitPrice !== null ||
        document.negotiatedPrice !== null ||
        document.standardPrice !== null;
      const payment = hasPrice
        ? calculatePaymentState({
            totalCopies: nextTotalCopies,
            standardPrice:
              document.standardPrice === null ? null : Number(document.standardPrice),
            negotiatedPrice:
              document.negotiatedPrice === null ? null : Number(document.negotiatedPrice),
            unitPrice: document.unitPrice === null ? null : Number(document.unitPrice),
            discount: document.discount === null ? null : Number(document.discount),
            surcharge: document.surcharge === null ? null : Number(document.surcharge),
            amountPaid: document.amountPaid === null ? null : Number(document.amountPaid),
            paidAt: document.paidAt,
            currency: document.currency,
          }, {})
        : null;
      if (payment && !payment.success) {
        throw new Error(`Unable to reprice printed document: ${payment.code}`);
      }

      await tx.document.update({
        where: { id: document.id },
        data: {
          statusId: printedStatus?.id ?? document.statusId,
          totalCopies: nextTotalCopies,
          ...(payment?.success ? payment.value : {}),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: printDocumentActivity.id,
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

      return {
        kind: "printed",
        documentId: document.id,
        historyId: history.id,
      } as const;
    });

    if (result.kind === "not-found") {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }
    if (result.kind === "invalid-printer") {
      return NextResponse.json(
        { message: "Printer not found or inactive", code: "INVALID_PRINTER" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Document printed",
      documentId: result.documentId,
      printHistoryId: result.historyId,
    });
  } catch (error) {
    return internalServerError(
      { route: "/api/documents/[documentId]/print", operation: "record_print" },
      error,
      "Print failed",
    );
  }
}
