import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ADMIN_ROLES = new Set(["admin"]);
const EMPLOYEE_ROLES = new Set(["employee"]);

function isRoleAllowed(roles: string[], allowed: Set<string>) {
  return roles.some((role) => allowed.has(role));
}

export default async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
    query: { disableRefresh: true },
  });

  if (!session?.user?.email) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const roleNames = user.roles.map((role) => role.role.name);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (!isRoleAllowed(roleNames, ADMIN_ROLES)) {
      return NextResponse.redirect(new URL("/documents", request.url));
    }
  }

  if (pathname.startsWith("/documents")) {
    if (!isRoleAllowed(roleNames, ADMIN_ROLES) && !isRoleAllowed(roleNames, EMPLOYEE_ROLES)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/documents/:path*"],
};
