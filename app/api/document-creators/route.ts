import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";
import { hasAnyRole } from "@/lib/permissions";
import { parseIntegerQueryParam } from "@/lib/query-params";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  if (!hasAnyRole(authResult.currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();
  const limitResult = parseIntegerQueryParam(url.searchParams, "limit", {
    defaultValue: 50,
    min: 5,
    max: 200,
  });
  if (!limitResult.success) {
    return NextResponse.json(limitResult.error, { status: 400 });
  }
  const limit = limitResult.value;

  try {
    type DocumentCreatorRow = {
      id: string;
      name: string | null;
      email: string;
    };

    const users: DocumentCreatorRow[] = await prisma.user.findMany({
      where: {
        deletedAt: null,
        createdDocuments: {
          some: {},
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      users.map((user: DocumentCreatorRow) => ({
        id: user.id,
        label: user.name || user.email,
        email: user.email,
      })),
    );
  } catch (error) {
    return internalServerError(
      { route: "/api/document-creators", operation: "list_document_creators" },
      error,
    );
  }
}
