import fs from "node:fs/promises";
import { constants } from "node:fs";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { areReadinessDependenciesAvailable } from "@/lib/readiness-policy";
import { resolveStorageRoot } from "@/services/documentStorageService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ready = await areReadinessDependenciesAvailable([
    () => prisma.$queryRaw`SELECT 1`,
    () => fs.access(resolveStorageRoot(), constants.R_OK | constants.W_OK),
  ]);

  return NextResponse.json(
    { status: ready ? "ok" : "unavailable" },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
