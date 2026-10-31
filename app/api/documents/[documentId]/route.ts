import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function PATCH(request: NextRequest, _context: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      message:
        "Document is immutable. Create a new version from this document instead.",
      code: "DOCUMENT_IMMUTABLE",
    },
    { status: 405 },
  );
}
