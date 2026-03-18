import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";

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
    console.error("Error fetching template assets:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
