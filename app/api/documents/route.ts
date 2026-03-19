import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const url = new URL(request.url);
  const statusId = url.searchParams.get("statusId");
  const templateId = url.searchParams.get("templateId");
  const search = url.searchParams.get("q")?.trim();
  const dateFrom = url.searchParams.get("from");
  const dateTo = url.searchParams.get("to");
  const createdById = url.searchParams.get("createdById");
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

  const where: Record<string, unknown> = {};

  if (statusId) {
    where.statusId = Number(statusId);
  }
  if (templateId) {
    where.templateId = templateId;
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  if (createdById) {
    where.createdById = createdById;
  }
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { template: { title: { contains: search, mode: "insensitive" } } },
      { template: { titleAr: { contains: search, mode: "insensitive" } } },
      { createdBy: { name: { contains: search, mode: "insensitive" } } },
      { createdBy: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    const [documents, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        include: {
          template: { include: { category: true } },
          status: true,
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: documents.map((document) => ({
          id: document.id,
          templateId: document.templateId,
          templateTitle: document.template.titleAr || document.template.title,
          templateCategory:
            document.template.category?.nameAr || document.template.category?.name || null,
          statusId: document.statusId,
          statusName: document.status.nameAr || document.status.name,
          statusColor: document.status.color,
          createdAt: document.createdAt.toISOString(),
          createdByName: document.createdBy.name || document.createdBy.email || "—",
          chargedTotal: document.chargedTotal ? document.chargedTotal.toString() : null,
          currency: document.currency || "MAD",
          totalCopies: document.totalCopies,
          filePath: document.filePath,
        })),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
