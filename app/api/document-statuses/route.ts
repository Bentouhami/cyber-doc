import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
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
    console.error("Error fetching document statuses:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
