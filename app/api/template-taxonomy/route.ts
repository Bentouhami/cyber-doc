import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";

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
    console.error("Error fetching template taxonomy:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
