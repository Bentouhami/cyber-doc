import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  console.log("Fetching all users");
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    console.log("Fetched users:", users);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
