import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

export async function GET(
  request: Request,
  context: { params: Promise<{ personaId: string }> },
) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { personaId } = await context.params;
  if (!personaId) {
    return NextResponse.json({ message: "personaId is required" }, { status: 400 });
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

  try {
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      select: {
        id: true,
        fullName: true,
        fullNameAr: true,
        nationalId: true,
        phone: true,
        city: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ message: "Persona not found" }, { status: 404 });
    }

    const where = { personaId };

    const [participants, total] = await prisma.$transaction([
      prisma.documentParticipant.findMany({
        where,
        include: {
          document: {
            include: {
              template: {
                include: {
                  category: true,
                },
              },
              status: true,
              createdBy: true,
            },
          },
        },
        orderBy: {
          document: {
            createdAt: "desc",
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.documentParticipant.count({ where }),
    ]);

    return NextResponse.json({
      persona,
      data: participants.map((participant) => ({
        documentId: participant.documentId,
        roleKey: participant.roleKey,
        roleLabel: participant.roleLabel,
        createdAt: participant.document.createdAt.toISOString(),
        updatedAt: participant.document.updatedAt.toISOString(),
        template: {
          id: participant.document.template.id,
          slug: participant.document.template.slug,
          title: participant.document.template.title,
          titleAr: participant.document.template.titleAr,
          categoryName:
            participant.document.template.category.nameAr ||
            participant.document.template.category.name,
        },
        status: {
          id: participant.document.status.id,
          name: participant.document.status.name,
          nameAr: participant.document.status.nameAr,
          color: participant.document.status.color,
        },
        createdBy: {
          id: participant.document.createdBy.id,
          name: participant.document.createdBy.name,
          email: participant.document.createdBy.email,
        },
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching persona documents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
