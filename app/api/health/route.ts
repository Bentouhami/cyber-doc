import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { areReadinessDependenciesAvailable } from "@/lib/readiness-policy";
import { isDocumentStorageAvailable } from "@/services/documentStorageService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ready = await areReadinessDependenciesAvailable([
    () => prisma.$queryRaw`SELECT 1`,
    () => isDocumentStorageAvailable(),
  ]);

  return NextResponse.json(
    { status: ready ? "ok" : "unavailable" },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
