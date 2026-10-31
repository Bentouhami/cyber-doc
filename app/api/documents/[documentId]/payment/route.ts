import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import {
  calculatePaymentState,
  paymentUpdateSchema,
  type PaymentUpdate,
} from "@/lib/payment-policy";
import { hasAnyRole } from "@/lib/permissions";
import { lockDocumentForUpdate } from "@/lib/document-transaction-lock";

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

  let data: PaymentUpdate;
  try {
    const body = await request.json();
    const parsed = paymentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    data = parsed.data;
  } catch (error) {
    logApiError(
      { route: "/api/documents/[documentId]/payment", operation: "parse_request" },
      error,
    );
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  const { documentId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (!(await lockDocumentForUpdate(tx, documentId))) {
        return { kind: "not-found" } as const;
      }
      const existing = await tx.document.findUnique({
        where: { id: documentId },
        select: {
          totalCopies: true,
          standardPrice: true,
          negotiatedPrice: true,
          unitPrice: true,
          discount: true,
          surcharge: true,
          amountPaid: true,
          paidAt: true,
          currency: true,
        },
      });
      if (!existing) return { kind: "not-found" } as const;

      const calculated = calculatePaymentState(
        {
          totalCopies: existing.totalCopies,
          standardPrice:
            existing.standardPrice === null
              ? null
              : Number(existing.standardPrice),
          negotiatedPrice:
            existing.negotiatedPrice === null
              ? null
              : Number(existing.negotiatedPrice),
          unitPrice:
            existing.unitPrice === null ? null : Number(existing.unitPrice),
          discount:
            existing.discount === null ? null : Number(existing.discount),
          surcharge:
            existing.surcharge === null ? null : Number(existing.surcharge),
          amountPaid:
            existing.amountPaid === null ? null : Number(existing.amountPaid),
          paidAt: existing.paidAt,
          currency: existing.currency,
        },
        data,
      );

      if (!calculated.success) {
        return {
          kind: "invalid-payment",
          code: calculated.code,
          message: calculated.message,
        } as const;
      }

      const activityType = await tx.activityType.findUnique({
        where: { name: "UPDATE_DOCUMENT" },
        select: { id: true },
      });
      if (!activityType) {
        throw new Error("Required UPDATE_DOCUMENT activity type is missing");
      }

      const document = await tx.document.update({
        where: { id: documentId },
        data: {
          ...calculated.value,
          cashierId: currentUser.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: activityType.id,
          resourceType: "Document",
          resourceId: document.id,
        },
      });

      return { kind: "updated", document } as const;
    });

    if (result.kind === "not-found") {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }
    if (result.kind === "invalid-payment") {
      return NextResponse.json(
        { message: result.message, code: result.code },
        { status: 400 },
      );
    }
    const document = result.document;

    return NextResponse.json({
      id: document.id,
      paymentStatus: document.paymentStatus,
      paidAt: document.paidAt?.toISOString() ?? null,
      chargedTotal: document.chargedTotal?.toString() ?? null,
      amountPaid: document.amountPaid?.toString() ?? null,
      changeGiven: document.changeGiven?.toString() ?? null,
    });
  } catch (error) {
    return internalServerError(
      { route: "/api/documents/[documentId]/payment", operation: "update_payment" },
      error,
    );
  }
}
