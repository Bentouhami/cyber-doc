import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";
import { findTemplateDuplicateCandidates } from "@/services/templateDuplicateService";
import { importTemplateWithAsset } from "@/services/templateImportService";

export const runtime = "nodejs";

const metaSchema = z.object({
  title: z.string().min(3),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  documentTypeName: z.string().min(2),
  documentTypeNameAr: z.string().optional(),
  categoryName: z.string().min(2),
  categoryNameAr: z.string().optional(),
});

function slugifyBase(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(base: string) {
  const normalized = slugifyBase(base) || "template-import-request";
  const seed = `${normalized}-${Date.now().toString(36)}`;
  let slug = seed;
  let counter = 1;

  while (await prisma.documentTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${seed}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function extractDocxHtml(buffer: Buffer) {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ buffer });
    return result.value || "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { currentUser } = authResult;
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const metaRaw = formData.get("meta");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing file" }, { status: 400 });
  }
  if (typeof metaRaw !== "string") {
    return NextResponse.json({ message: "Missing metadata" }, { status: 400 });
  }

  let metaJson: unknown;
  try {
    metaJson = JSON.parse(metaRaw);
  } catch {
    return NextResponse.json({ message: "Invalid metadata JSON" }, { status: 400 });
  }

  const parsedMeta = metaSchema.safeParse(metaJson);
  if (!parsedMeta.success) {
    return NextResponse.json({ message: "Invalid metadata", issues: parsedMeta.error.flatten() }, { status: 400 });
  }

  const meta = parsedMeta.data;
  const fileName = file.name || "template.docx";
  if (!fileName.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ message: "Only .docx files are allowed" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ message: "File too large (max 10MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const forceDuplicateOverride = formData.get("forceDuplicateOverride") === "true";

  const duplicateCandidates = await findTemplateDuplicateCandidates(prisma, {
    title: meta.title,
    locale: "ar-MA",
    documentTypeName: meta.documentTypeName,
    categoryName: meta.categoryName,
    checksum,
  });

  if (duplicateCandidates.length > 0 && !forceDuplicateOverride) {
    return NextResponse.json(
      {
        code: "DUPLICATE_CANDIDATE",
        message: "Potential duplicate templates detected",
        candidates: duplicateCandidates,
      },
      { status: 409 },
    );
  }

  const slug = await ensureUniqueSlug(meta.title);
  const ext = path.extname(fileName).toLowerCase();
  const storedName = `${slug}${ext}`;
  const relativeDir = path.join("storage", "template-requests");
  const absoluteDir = path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    relativeDir,
  );
  await mkdir(absoluteDir, { recursive: true });

  const relativePath = path.join("template-requests", storedName).replace(/\\/g, "/");
  await writeFile(path.join(absoluteDir, storedName), buffer);

  const extractedHtml = await extractDocxHtml(buffer);
  const contentHtml = extractedHtml
    ? `<div class="page">${extractedHtml}</div>`
    : `<div class="page"><h1>${meta.titleAr || meta.title}</h1><p>Template imported from Word and pending admin review.</p></div>`;

  const template = await importTemplateWithAsset(prisma, {
    slug,
    title: meta.title,
    titleAr: meta.titleAr ?? null,
    description: meta.description ?? null,
    locale: "ar-MA",
    language: "ar",
    version: 1,
    isActive: false,
    metadata: {
      requestSource: "employee_docx_import",
      reviewStatus: "PENDING",
      requestedByUserId: currentUser.id,
      requestedAt: new Date().toISOString(),
      importFileName: fileName,
      basePrice: null,
      htmlCss:
        'body { direction: rtl; font-family: "Tajawal", "Segoe UI", Arial, sans-serif; } .page { padding: 24px; }',
      pdfOptions: {
        format: "A4",
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      },
    },
    contentHtml,
    documentType: {
      name: meta.documentTypeName,
      nameAr: meta.documentTypeNameAr ?? undefined,
    },
    category: {
      name: meta.categoryName,
      nameAr: meta.categoryNameAr ?? undefined,
    },
    asset: {
      fileName,
      filePath: relativePath,
      fileType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: file.size,
      storageDriver: "local",
      checksum,
      version: 1,
      metadata: {
        source: "employee_import",
        storedIn: relativeDir.replace(/\\/g, "/"),
      },
    },
  });

  return NextResponse.json(
    {
      message: "Word import converted to draft template and queued for admin review",
      templateId: template.id,
      slug: template.slug,
    },
    { status: 201 },
  );
}
