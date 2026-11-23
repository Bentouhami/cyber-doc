import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";
import { hasAnyRole } from "@/lib/permissions";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  if (!hasAnyRole(authResult.currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const statuses = await prisma.documentStatus.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(
      statuses.map((status) => ({
        id: status.id,
        name: status.name,
        nameAr: status.nameAr,
        color: status.color,
      })),
    );
  } catch (error) {
    return internalServerError(
      { route: "/api/document-statuses", operation: "list_document_statuses" },
      error,
    );
  }
}
