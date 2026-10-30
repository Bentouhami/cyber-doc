import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isUserActive } from "@/lib/user-access-policy";

export async function ensureAdminUser(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableRefresh: true },
  });

  const userId = session?.user.id;

  if (!userId) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!currentUser || !isUserActive(currentUser)) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const isAdmin = currentUser.roles.some((role) => role.role.name === "admin");

  if (!isAdmin) {
    return { error: new NextResponse("Forbidden", { status: 403 }) };
  }

  return { currentUser };
}

export async function getAuthenticatedUser(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableRefresh: true },
  });

  const userId = session?.user.id;

  if (!userId) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!currentUser || !isUserActive(currentUser)) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  return { currentUser };
}
