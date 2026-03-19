import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

const paymentSchema = z.object({
  standardPrice: z.number().optional(),
  negotiatedPrice: z.number().optional(),
  unitPrice: z.number().optional(),
  discount: z.number().optional(),
  surcharge: z.number().optional(),
  chargedTotal: z.number().optional(),
  amountPaid: z.number().optional(),
  changeGiven: z.number().optional(),
  paidAt: z.string().datetime().optional(),
  paymentStatus: z.string().optional(),
  currency: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;

  const isEmployee = hasAnyRole(currentUser, ["employee", "admin"]);
  if (!isEmployee) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: z.infer<typeof paymentSchema>;
  try {
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);
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

  try {
    const document = await prisma.$transaction(async (tx) => {
      const existing = await tx.document.findUnique({
        where: { id: documentId },
        select: {
          totalCopies: true,
          standardPrice: true,
          negotiatedPrice: true,
          unitPrice: true,
          discount: true,
          surcharge: true,
          chargedTotal: true,
          amountPaid: true,
          currency: true,
        },
      });
      if (!existing) {
        throw new Error("Document not found");
      }

      const unitPrice = data.unitPrice ?? existing.unitPrice ?? existing.standardPrice ?? undefined;
      const discount = data.discount ?? existing.discount ?? 0;
      const surcharge = data.surcharge ?? existing.surcharge ?? 0;
      const totalCopies = existing.totalCopies ?? 1;
      const chargedTotal =
        data.chargedTotal ?? (unitPrice ? unitPrice * totalCopies - discount + surcharge : undefined);
      const amountPaid = data.amountPaid ?? existing.amountPaid ?? undefined;
      const changeGiven =
        data.changeGiven ?? (chargedTotal !== undefined && amountPaid !== undefined
          ? Math.max(0, amountPaid - chargedTotal)
          : undefined);
      const paymentStatus =
        data.paymentStatus ??
        (chargedTotal !== undefined && amountPaid !== undefined
          ? amountPaid >= chargedTotal
            ? "PAID"
            : amountPaid > 0
              ? "PARTIAL"
              : "UNPAID"
          : amountPaid
            ? "PARTIAL"
            : undefined);
      const paidAt =
        data.paidAt ? new Date(data.paidAt) : amountPaid ? new Date() : undefined;

      return tx.document.update({
        where: { id: documentId },
        data: {
          standardPrice: data.standardPrice ?? existing.standardPrice ?? null,
          negotiatedPrice: data.negotiatedPrice ?? existing.negotiatedPrice ?? null,
          unitPrice: unitPrice ?? null,
          discount: data.discount ?? existing.discount ?? null,
          surcharge: data.surcharge ?? existing.surcharge ?? null,
          chargedTotal: chargedTotal ?? null,
          amountPaid: amountPaid ?? null,
          changeGiven: changeGiven ?? null,
          paidAt,
          paymentStatus,
          currency: data.currency ?? existing.currency ?? "MAD",
          cashierId: currentUser.id,
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        activityType: { connect: { name: "UPDATE_DOCUMENT" } },
        resourceType: "Document",
        resourceId: document.id,
      },
    });

    return NextResponse.json({
      id: document.id,
      paymentStatus: document.paymentStatus,
      paidAt: document.paidAt?.toISOString() ?? null,
      chargedTotal: document.chargedTotal?.toString() ?? null,
      amountPaid: document.amountPaid?.toString() ?? null,
      changeGiven: document.changeGiven?.toString() ?? null,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: message === "Document not found" ? 404 : 500 });
  }
}
