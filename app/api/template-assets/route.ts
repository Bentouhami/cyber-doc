import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";
import { internalServerError } from "@/lib/api-error";

export async function GET(request: Request) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  try {
    const assets = await prisma.templateAsset.findMany({
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(
      assets.map((asset) => ({
        id: asset.id,
        fileName: asset.fileName,
        filePath: asset.filePath,
        version: asset.version,
      })),
    );
  } catch (error) {
    return internalServerError(
      { route: "/api/template-assets", operation: "list_template_assets" },
      error,
    );
  }
}
