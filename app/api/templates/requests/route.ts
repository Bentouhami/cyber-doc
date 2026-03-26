import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";
import { importTemplateWithAsset } from "@/services/templateImportService";

export const runtime = "nodejs";

const requestSchema = z.object({
  title: z.string().min(3),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  documentType: z.object({
    name: z.string().min(2),
    nameAr: z.string().optional(),
  }),
  category: z.object({
    name: z.string().min(2),
    nameAr: z.string().optional(),
  }),
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
  const normalized = slugifyBase(base) || "template-request";
  const seed = `${normalized}-${Date.now().toString(36)}`;
  let slug = seed;
  let counter = 1;

  while (await prisma.documentTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${seed}-${counter}`;
    counter += 1;
  }
  return slug;
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

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const slug = await ensureUniqueSlug(payload.title);

  const template = await importTemplateWithAsset(prisma, {
    slug,
    title: payload.title,
    titleAr: payload.titleAr ?? null,
    description: payload.description ?? null,
    locale: "ar-MA",
    language: "ar",
    version: 1,
    isActive: false,
    metadata: {
      requestSource: "employee_manual",
      reviewStatus: "PENDING",
      requestedByUserId: currentUser.id,
      requestedAt: new Date().toISOString(),
      basePrice: null,
      htmlCss:
        'body { direction: rtl; font-family: "Tajawal", "Segoe UI", Arial, sans-serif; } .page { padding: 24px; }',
      pdfOptions: {
        format: "A4",
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      },
    },
    contentHtml: `
<div class="page">
  <h1>${payload.titleAr || payload.title}</h1>
  <p>نموذج أولي تم إنشاؤه من طرف الموظف ويحتاج مراجعة الإدارة قبل التفعيل.</p>
  <p>الاسم الكامل: {{client.fullName}}</p>
  <p>رقم البطاقة الوطنية: {{client.nationalId}}</p>
  <p>الهاتف: {{client.phone}}</p>
</div>`.trim(),
    documentType: payload.documentType,
    category: payload.category,
    participantRoles: [
      {
        roleKey: "client",
        roleLabel: "Client",
        roleLabelAr: "الزبون",
        isRequired: true,
        minParticipants: 1,
        maxParticipants: 1,
        displayOrder: 1,
      },
    ],
    fields: [
      {
        fieldName: "client.fullName",
        fieldLabel: "Nom complet",
        fieldLabelAr: "الاسم الكامل",
        fieldType: "TEXT",
        isRequired: true,
        participantRoleKey: "client",
        dataSource: "personas.client.fullName",
        displayOrder: 1,
      },
      {
        fieldName: "client.nationalId",
        fieldLabel: "CIN",
        fieldLabelAr: "رقم البطاقة الوطنية",
        fieldType: "TEXT",
        participantRoleKey: "client",
        dataSource: "personas.client.nationalId",
        displayOrder: 2,
      },
      {
        fieldName: "client.phone",
        fieldLabel: "Téléphone",
        fieldLabelAr: "الهاتف",
        fieldType: "PHONE",
        participantRoleKey: "client",
        dataSource: "personas.client.phone",
        displayOrder: 3,
      },
    ],
  });

  return NextResponse.json(
    {
      message: "Template request created and queued for admin review",
      templateId: template.id,
      slug: template.slug,
    },
    { status: 201 },
  );
}

