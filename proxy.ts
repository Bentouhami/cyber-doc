import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isUserActive } from "@/lib/user-access-policy";
import { buildApplicationContentSecurityPolicy } from "@/lib/security-headers";

const ADMIN_ROLES = new Set(["admin"]);
const EMPLOYEE_ROLES = new Set(["employee"]);

function isRoleAllowed(roles: string[], allowed: Set<string>) {
  return roles.some((role) => allowed.has(role));
}

export default async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const contentSecurityPolicy = buildApplicationContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const secureResponse = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };
  const pathname = request.nextUrl.pathname;
  const isProtectedPage =
    pathname.startsWith("/admin") || pathname.startsWith("/documents");

  if (!isProtectedPage) {
    return secureResponse(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  }

  const session = await auth.api.getSession({
    headers: request.headers,
    query: { disableRefresh: true },
  });

  if (!session?.user?.id) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return secureResponse(NextResponse.redirect(loginUrl));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { include: { role: true } } },
  });

  if (!user || !isUserActive(user)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return secureResponse(NextResponse.redirect(loginUrl));
  }

  const roleNames = user.roles.map((role) => role.role.name);
  if (pathname.startsWith("/admin")) {
    if (!isRoleAllowed(roleNames, ADMIN_ROLES)) {
      return secureResponse(NextResponse.redirect(new URL("/documents", request.url)));
    }
  }

  if (pathname.startsWith("/documents")) {
    if (!isRoleAllowed(roleNames, ADMIN_ROLES) && !isRoleAllowed(roleNames, EMPLOYEE_ROLES)) {
      return secureResponse(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  return secureResponse(
    NextResponse.next({ request: { headers: requestHeaders } }),
  );
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
