import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import { externalShortcutCreateSchema } from "@/lib/external-shortcut-validation";
import { hasManagementRole } from "@/lib/management-role-policy";
import { hasAnyRole } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) return authResult.error;
  if (!hasAnyRole(authResult.currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const roleNames = authResult.currentUser.roles.map((entry) => entry.role.name);
  const includeInactive =
    new URL(request.url).searchParams.get("includeInactive") === "true" &&
    hasManagementRole(roleNames);

  try {
    const shortcuts = await prisma.externalShortcut.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(shortcuts);
  } catch (error) {
    return internalServerError({ route: "/api/shortcuts", operation: "list_shortcuts" }, error);
  }
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) return authResult.error;
  if (!hasManagementRole(authResult.currentUser.roles.map((entry) => entry.role.name))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = externalShortcutCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid shortcut", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const shortcut = await prisma.externalShortcut.create({ data: parsed.data });
    return NextResponse.json(shortcut, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      logApiError({ route: "/api/shortcuts", operation: "parse_request" }, error);
      return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
    }
    return internalServerError({ route: "/api/shortcuts", operation: "create_shortcut" }, error);
  }
}
