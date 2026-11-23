import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import { externalShortcutUpdateSchema } from "@/lib/external-shortcut-validation";
import { hasManagementRole } from "@/lib/management-role-policy";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ shortcutId: string }> };

async function authorize(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) return authResult;
  if (!hasManagementRole(authResult.currentUser.roles.map((entry) => entry.role.name))) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return authResult;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authResult = await authorize(request);
  if ("error" in authResult) return authResult.error;
  const { shortcutId } = await params;

  try {
    const parsed = externalShortcutUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid shortcut", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updated = await prisma.externalShortcut.updateMany({
      where: { id: shortcutId },
      data: parsed.data,
    });
    if (!updated.count) {
      return NextResponse.json({ message: "Shortcut not found" }, { status: 404 });
    }
    return NextResponse.json(await prisma.externalShortcut.findUnique({ where: { id: shortcutId } }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      logApiError({ route: "/api/shortcuts/[shortcutId]", operation: "parse_request" }, error);
      return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
    }
    return internalServerError(
      { route: "/api/shortcuts/[shortcutId]", operation: "update_shortcut" },
      error,
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const authResult = await authorize(request);
  if ("error" in authResult) return authResult.error;
  const { shortcutId } = await params;

  try {
    const archived = await prisma.externalShortcut.updateMany({
      where: { id: shortcutId },
      data: { isActive: false },
    });
    if (!archived.count) {
      return NextResponse.json({ message: "Shortcut not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError(
      { route: "/api/shortcuts/[shortcutId]", operation: "archive_shortcut" },
      error,
    );
  }
}
