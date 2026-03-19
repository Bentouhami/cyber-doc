import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { documentId } = await params;

  const [document, draftStatus, pdfFormat] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
      select: {
        templateId: true,
        currency: true,
        fieldValues: {
          select: {
            fieldId: true,
            value: true,
            valueJson: true,
          },
        },
        participants: {
          select: {
            personaId: true,
            roleKey: true,
            roleLabel: true,
          },
        },
      },
    }),
    prisma.documentStatus.findFirst({ where: { name: "DRAFT" } }),
    prisma.fileFormat.findFirst({ where: { name: "PDF" } }),
  ]);

  if (!document) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }
  if (!draftStatus || !pdfFormat) {
    return NextResponse.json(
      { message: "Document defaults are not configured. Please seed the database." },
      { status: 500 },
    );
  }

  try {
    const duplicated = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          templateId: document.templateId,
          createdById: currentUser.id,
          statusId: draftStatus.id,
          fileFormatId: pdfFormat.id,
          totalCopies: 1,
          currency: document.currency || "MAD",
        },
      });

      if (document.fieldValues.length) {
        await tx.documentFieldValue.createMany({
          data: document.fieldValues.map((value) => ({
            documentId: created.id,
            fieldId: value.fieldId,
            value: value.value,
            ...(value.valueJson !== null && value.valueJson !== undefined
              ? { valueJson: value.valueJson as Prisma.InputJsonValue }
              : {}),
          })),
        });
      }

      if (document.participants.length) {
        await tx.documentParticipant.createMany({
          data: document.participants.map((participant) => ({
            documentId: created.id,
            personaId: participant.personaId,
            roleKey: participant.roleKey,
            roleLabel: participant.roleLabel,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return NextResponse.json({ documentId: duplicated.id });
  } catch (error) {
    console.error("Duplicate failed:", error);
    return NextResponse.json({ message: "Duplicate failed" }, { status: 500 });
  }
}
