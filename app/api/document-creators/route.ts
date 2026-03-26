import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 5), 200);

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
    console.error("Error fetching document creators:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
