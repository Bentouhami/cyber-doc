import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";

export async function GET(request: Request) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  try {
    const documentTypes = await prisma.documentType.findMany({
      orderBy: { name: "asc" },
      include: {
        categories: {
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json(
      documentTypes.map((documentType) => ({
        id: documentType.id,
        name: documentType.name,
        nameAr: documentType.nameAr,
        categories: documentType.categories.map((category) => ({
          id: category.id,
          name: category.name,
          nameAr: category.nameAr,
        })),
      })),
    );
  } catch (error) {
    return internalServerError(
      { route: "/api/template-taxonomy", operation: "list_template_taxonomy" },
      error,
    );
  }
}
