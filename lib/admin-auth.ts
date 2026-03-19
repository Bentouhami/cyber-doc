import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function ensureAdminUser(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableRefresh: true },
  });

  const userEmail = session?.user.email;

  if (!userEmail) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!currentUser) {
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

  const userEmail = session?.user.email;

  if (!userEmail) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!currentUser) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  return { currentUser };
}
