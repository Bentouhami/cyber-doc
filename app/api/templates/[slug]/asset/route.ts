import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError, logApiError } from "@/lib/api-error";
import { safeDownloadFileName } from "@/services/storageSecurity";
import { readTemplateAssetFile } from "@/services/templateAssetStorageService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const { slug } = await params;
  let template;
  try {
    template = await prisma.documentTemplate.findUnique({
      where: { slug },
      include: { asset: true },
    });
  } catch (error) {
    return internalServerError(
      { route: "/api/templates/[slug]/asset", operation: "load_template_asset" },
      error,
    );
  }

  if (!template?.asset?.filePath) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const buffer = await readTemplateAssetFile(template.asset.filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          template.asset.fileType ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeDownloadFileName(template.asset.fileName, "template.docx")}"`,
      },
    });
  } catch (error) {
    logApiError(
      { route: "/api/templates/[slug]/asset", operation: "read_stored_asset" },
      error,
    );
    return new NextResponse("File not found", { status: 404 });
  }
}
