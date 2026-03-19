import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { ensureAdminUser } from "@/lib/admin-auth";
import { importTemplateWithAsset } from "@/services/templateImportService";

const assetSchema = z.object({
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.number().int().optional(),
  storageDriver: z.string().optional(),
  checksum: z.string().optional(),
  version: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

const participantRoleSchema = z.object({
  roleKey: z.string().min(1),
  roleLabel: z.string().min(1),
  roleLabelAr: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  minParticipants: z.number().int().optional(),
  maxParticipants: z.number().int().optional(),
  displayOrder: z.number().int().optional(),
});

const fieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldLabel: z.string().min(1),
  fieldLabelAr: z.string().optional(),
  fieldType: z.string().min(1),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional(),
  validationRules: z.record(z.any()).optional(),
  placeholder: z.string().optional(),
  placeholderAr: z.string().optional(),
  helpText: z.string().optional(),
  helpTextAr: z.string().optional(),
  dataSource: z.string().optional(),
  participantRoleKey: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  section: z.string().optional(),
  sectionAr: z.string().optional(),
  displayOrder: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

const groupAssignmentSchema = z.object({
  groupCode: z.string().min(1),
  displayOrder: z.number().int().optional(),
  isRequired: z.boolean().optional(),
});

const payloadSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  titleAr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
  version: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  contentHtml: z.string().nullable().optional(),
  contentCss: z.string().nullable().optional(),
  pdfOptions: z
    .object({
      format: z.string().optional(),
      margin: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  documentType: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
  category: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
  asset: assetSchema.optional(),
  participantRoles: z.array(participantRoleSchema).optional(),
  fields: z.array(fieldSchema).optional(),
  groupAssignments: z.array(groupAssignmentSchema).optional(),
});

function isInvalidPath(filePath: string) {
  if (filePath.startsWith("/") || filePath.includes(":")) {
    return true;
  }
  if (filePath.includes("..")) {
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  let data: z.infer<typeof payloadSchema>;
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    data = parsed.data;
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return NextResponse.json({ message: "Unable to parse request body" }, { status: 400 });
  }

  if (data.asset?.filePath && isInvalidPath(data.asset.filePath)) {
    return NextResponse.json({ message: "Invalid asset filePath" }, { status: 400 });
  }

  const existingTemplate = await prisma.documentTemplate.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  try {
    const template = await importTemplateWithAsset(prisma, data);
    const activityName = existingTemplate ? "UPDATE_TEMPLATE" : "CREATE_TEMPLATE";

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        activityType: {
          connect: { name: activityName },
        },
        resourceType: "DocumentTemplate",
        resourceId: template.id,
      },
    });

    return NextResponse.json({
      message: existingTemplate ? "Template updated" : "Template created",
      templateId: template.id,
      slug: template.slug,
    });
  } catch (error) {
    console.error("Template import failed:", error);
    const message = error instanceof Error ? error.message : "Template import failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
