import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const TEMPLATE_ASSETS_DIR = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "templates_docs",
);

function resolveTemplateAssetPath(filePath: string) {
  const normalized = filePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const relativePath = normalized.startsWith("templates_docs/")
    ? normalized.slice("templates_docs/".length)
    : normalized;

  if (!relativePath || relativePath.includes("..")) {
    return null;
  }

  const absolutePath = path.join(TEMPLATE_ASSETS_DIR, relativePath);
  const relativeFromBase = path.relative(TEMPLATE_ASSETS_DIR, absolutePath);

  if (
    relativeFromBase.startsWith("..") ||
    path.isAbsolute(relativeFromBase)
  ) {
    return null;
  }

  return absolutePath;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { slug } = await params;
  const template = await prisma.documentTemplate.findUnique({
    where: { slug },
    include: { asset: true },
  });

  if (!template?.asset?.filePath) {
    return new NextResponse("File not found", { status: 404 });
  }

  const absolutePath = resolveTemplateAssetPath(template.asset.filePath);
  if (!absolutePath) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  try {
    const buffer = await fs.readFile(absolutePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          template.asset.fileType ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${template.asset.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Template asset download failed:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
