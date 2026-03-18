import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/admin-auth";
import { mapUserToEmployeeDTO } from "@/mappers/EmployeeMapper";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authCheck = await getAuthenticatedUser(req.headers);

  if ("error" in authCheck) {
    return authCheck.error;
  }

  const { currentUser } = authCheck;

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  return NextResponse.json(mapUserToEmployeeDTO(user));
}
