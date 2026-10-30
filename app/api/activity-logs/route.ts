import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";
import prisma from "@/lib/prisma";
import { parseIntegerQueryParam } from "@/lib/query-params";

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(1).max(max).optional(),
  );

const auditFilterSchema = z.object({
  q: optionalText(100),
  activityType: optionalText(80),
  resourceType: optionalText(80),
  userId: optionalText(128),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: Request) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const searchParams = new URL(request.url).searchParams;
  const pageResult = parseIntegerQueryParam(searchParams, "page", {
    defaultValue: 1,
    min: 1,
    max: 1_000_000,
  });
  const pageSizeResult = parseIntegerQueryParam(searchParams, "pageSize", {
    defaultValue: 20,
    min: 1,
    max: 100,
  });

  if (!pageResult.success) {
    return NextResponse.json(pageResult.error, { status: 400 });
  }
  if (!pageSizeResult.success) {
    return NextResponse.json(pageSizeResult.error, { status: 400 });
  }

  const filtersResult = auditFilterSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    activityType: searchParams.get("activityType") ?? undefined,
    resourceType: searchParams.get("resourceType") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!filtersResult.success) {
    return NextResponse.json(
      { message: "Invalid query parameter", issues: filtersResult.error.flatten() },
      { status: 400 },
    );
  }

  const { q, activityType, resourceType, userId, from, to } = filtersResult.data;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && toDate && fromDate > toDate) {
    return NextResponse.json(
      {
        message: "Invalid query parameter",
        issues: [{ parameter: "from", expected: "date not later than to" }],
      },
      { status: 400 },
    );
  }

  const where = {
    ...(activityType ? { activityType: { name: activityType } } : {}),
    ...(resourceType ? { resourceType } : {}),
    ...(userId ? { userId } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { resourceType: { contains: q, mode: "insensitive" as const } },
            { resourceId: { contains: q, mode: "insensitive" as const } },
            { activityType: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const page = pageResult.value;
  const pageSize = pageSizeResult.value;

  try {
    const [entries, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        select: {
          id: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
          activityType: {
            select: {
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      data: entries.map((entry) => ({
        id: entry.id,
        activityType: entry.activityType.name,
        category: entry.activityType.category,
        actor: {
          id: entry.user.id,
          name: entry.user.name,
        },
        resource: {
          type: entry.resourceType,
          id: entry.resourceId,
        },
        createdAt: entry.createdAt.toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return internalServerError(
      { route: "/api/activity-logs", operation: "list_activity_logs" },
      error,
      "Unable to fetch activity logs",
    );
  }
}
