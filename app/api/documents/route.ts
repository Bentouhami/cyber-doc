import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";
import { hasAnyRole } from "@/lib/permissions";
import {
  MAX_DATABASE_INTEGER,
  parseDateOnlyQueryParam,
  parseIntegerQueryParam,
} from "@/lib/query-params";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  if (!hasAnyRole(authResult.currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId");
  const search = url.searchParams.get("q")?.trim();
  const dateFromResult = parseDateOnlyQueryParam(url.searchParams, "from");
  const dateToResult = parseDateOnlyQueryParam(url.searchParams, "to", {
    nextDay: true,
  });
  const createdById = url.searchParams.get("createdById");
  const pageResult = parseIntegerQueryParam(url.searchParams, "page", {
    defaultValue: 1,
    min: 1,
    max: 1_000_000,
  });
  const pageSizeResult = parseIntegerQueryParam(url.searchParams, "pageSize", {
    defaultValue: 20,
    min: 1,
    max: 100,
  });
  const statusIdResult = parseIntegerQueryParam(url.searchParams, "statusId", {
    defaultValue: 0,
    min: 1,
    max: MAX_DATABASE_INTEGER,
  });
  const documentTypeIdResult = parseIntegerQueryParam(
    url.searchParams,
    "documentTypeId",
    { defaultValue: 0, min: 1, max: MAX_DATABASE_INTEGER },
  );
  const categoryIdResult = parseIntegerQueryParam(url.searchParams, "categoryId", {
    defaultValue: 0,
    min: 1,
    max: MAX_DATABASE_INTEGER,
  });
  if (
    !pageResult.success ||
    !pageSizeResult.success ||
    !dateFromResult.success ||
    !dateToResult.success ||
    !statusIdResult.success ||
    !documentTypeIdResult.success ||
    !categoryIdResult.success
  ) {
    const issues = [
      ...(!pageResult.success ? pageResult.error.issues : []),
      ...(!pageSizeResult.success ? pageSizeResult.error.issues : []),
      ...(!dateFromResult.success ? dateFromResult.error.issues : []),
      ...(!dateToResult.success ? dateToResult.error.issues : []),
      ...(!statusIdResult.success ? statusIdResult.error.issues : []),
      ...(!documentTypeIdResult.success ? documentTypeIdResult.error.issues : []),
      ...(!categoryIdResult.success ? categoryIdResult.error.issues : []),
    ];
    return NextResponse.json(
      { message: "Invalid query parameter", issues },
      { status: 400 },
    );
  }
  const page = pageResult.value;
  const pageSize = pageSizeResult.value;

  const where: Record<string, unknown> = {};

  if (statusIdResult.value) {
    where.statusId = statusIdResult.value;
  }
  if (templateId) {
    where.templateId = templateId;
  }
  if (dateFromResult.value || dateToResult.value) {
    where.createdAt = {
      ...(dateFromResult.value ? { gte: dateFromResult.value } : {}),
      ...(dateToResult.value ? { lt: dateToResult.value } : {}),
    };
  }
  if (createdById) {
    where.createdById = createdById;
  }
  if (documentTypeIdResult.value || categoryIdResult.value) {
    where.template = {
      ...(documentTypeIdResult.value
        ? { documentTypeId: documentTypeIdResult.value }
        : {}),
      ...(categoryIdResult.value ? { categoryId: categoryIdResult.value } : {}),
    };
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

    return NextResponse.json({
      data: documents.map((document) => ({
        id: document.id,
        templateId: document.templateId,
        templateTitle: document.template.titleAr || document.template.title,
        templateCategory:
          document.template.category?.nameAr ||
          document.template.category?.name ||
          null,
        statusId: document.statusId,
        statusName: document.status.nameAr || document.status.name,
        statusColor: document.status.color,
        createdAt: document.createdAt.toISOString(),
        createdByName:
          document.createdBy.name || document.createdBy.email || "—",
        chargedTotal: document.chargedTotal
          ? document.chargedTotal.toString()
          : null,
        currency: document.currency || "MAD",
        totalCopies: document.totalCopies,
        versionNumber: document.versionNumber,
        isCurrentVersion: !document.supersededAt,
        filePath: document.filePath,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return internalServerError(
      { route: "/api/documents", operation: "list_documents" },
      error,
    );
  }
}
