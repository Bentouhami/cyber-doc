import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { ensureAdminUser, getAuthenticatedUser } from "@/lib/admin-auth";
import { hasAnyRole } from "@/lib/permissions";

function toNullableJsonInput(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

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

const templateUpdateSchema = z.object({
  title: z.string().optional(),
  titleAr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
  version: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  assetId: z.string().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  contentCss: z.string().nullable().optional(),
  basePrice: z.number().nullable().optional(),
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
  documentType: z
    .object({
      name: z.string().min(1),
      nameAr: z.string().optional(),
    })
    .optional(),
  category: z
    .object({
      name: z.string().min(1),
      nameAr: z.string().optional(),
    })
    .optional(),
  fields: z.array(fieldSchema).optional(),
  replaceFields: z.boolean().optional(),
  participantRoles: z.array(participantRoleSchema).optional(),
  replaceParticipantRoles: z.boolean().optional(),
});

function extractPlaceholders(html: string) {
  const matches = html.matchAll(/{{\s*([\w.]+)\s*}}/g);
  const values = new Set<string>();
  for (const match of matches) {
    if (match[1]) values.add(match[1]);
  }
  return [...values];
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

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

  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
      include: {
        documentType: true,
        category: true,
        asset: true,
        participantRoles: { orderBy: { displayOrder: "asc" } },
        fields: {
          include: {
            fieldType: true,
            groupField: { include: { group: true } },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      slug: template.slug,
      title: template.title,
      titleAr: template.titleAr,
      description: template.description,
      locale: template.locale,
      version: template.version,
      isActive: template.isActive,
      contentHtml: template.content,
      metadata: template.metadata ?? null,
      documentType: {
        name: template.documentType.name,
        nameAr: template.documentType.nameAr,
      },
      category: {
        name: template.category.name,
        nameAr: template.category.nameAr,
      },
      asset: template.asset
        ? {
            id: template.asset.id,
            fileName: template.asset.fileName,
            filePath: template.asset.filePath,
            version: template.asset.version,
            fileType: template.asset.fileType,
          }
        : null,
      participantRoles: template.participantRoles.map((role) => ({
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        roleLabelAr: role.roleLabelAr,
        description: role.description,
        isRequired: role.isRequired,
        minParticipants: role.minParticipants,
        maxParticipants: role.maxParticipants,
        displayOrder: role.displayOrder,
      })),
      fields: template.fields.map((field) => ({
        id: field.id,
        name: field.fieldName,
        label: field.fieldLabel,
        labelAr: field.fieldLabelAr,
        type: field.fieldType.name,
        isRequired: field.isRequired,
        allowMultiple: field.allowMultiple,
        section:
          field.sectionAr ||
          field.section ||
          field.groupField?.group?.nameAr ||
          field.groupField?.group?.name ||
          null,
        options: Array.isArray(field.options) ? field.options : null,
        helpText: field.helpText,
        helpTextAr: field.helpTextAr,
        dataSource: field.dataSource,
      })),
      updatedAt: template.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  const { slug } = await params;

  let data: z.infer<typeof templateUpdateSchema>;
  try {
    const body = await request.json();
    const parsed = templateUpdateSchema.safeParse(body);
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

  try {
  const template = await prisma.documentTemplate.findUnique({
    where: { slug },
    include: {
      fields: {
        select: {
          fieldName: true,
          fieldLabel: true,
          fieldLabelAr: true,
          isRequired: true,
        },
      },
    },
  });
    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const nextContent =
      data.contentHtml === undefined ? template.content : data.contentHtml;
    const shouldValidate =
      data.isActive === true || (template.isActive && data.contentHtml !== undefined);

    if (shouldValidate) {
      if (!nextContent) {
        return NextResponse.json(
          { message: "HTML template is required to publish." },
          { status: 400 },
        );
      }
      const placeholders = extractPlaceholders(nextContent);
      const missingRequired = template.fields
        .filter((field) => field.isRequired && !placeholders.includes(field.fieldName))
        .map((field) => ({
          fieldName: field.fieldName,
          label: field.fieldLabelAr || field.fieldLabel,
        }));
      if (missingRequired.length) {
        return NextResponse.json(
          {
            message: "Missing required placeholders.",
            missingRequired,
          },
          { status: 400 },
        );
      }
    }

    const shouldMergeMetadata =
      data.metadata !== undefined ||
      data.contentCss !== undefined ||
      data.pdfOptions !== undefined ||
      data.basePrice !== undefined;
    const baseMetadata =
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as Record<string, unknown>)
        : {};
    const mergedMetadata = shouldMergeMetadata
      ? {
          ...baseMetadata,
          ...(data.metadata ?? {}),
        }
      : undefined;
    if (shouldMergeMetadata && mergedMetadata) {
      const incomingMetadata =
        data.metadata && typeof data.metadata === "object"
          ? (data.metadata as Record<string, unknown>)
          : {};

      if (data.basePrice !== undefined) {
        mergedMetadata.basePrice = data.basePrice;
      }
      if (data.contentCss !== undefined) {
        mergedMetadata.htmlCss = data.contentCss;
      }
      if (data.pdfOptions !== undefined) {
        mergedMetadata.pdfOptions = data.pdfOptions;
      }

      if ("reviewStatus" in incomingMetadata) {
        mergedMetadata.reviewedByUserId = currentUser.id;
        if (typeof incomingMetadata.reviewedAt !== "string") {
          mergedMetadata.reviewedAt = new Date().toISOString();
        }
      }

      if ("archivedAt" in incomingMetadata) {
        if (incomingMetadata.archivedAt) {
          mergedMetadata.archivedByUserId = currentUser.id;
          if (typeof incomingMetadata.archivedAt !== "string") {
            mergedMetadata.archivedAt = new Date().toISOString();
          }
        } else {
          mergedMetadata.archivedByUserId = null;
        }
      }
    }
    const metadataValue =
      shouldMergeMetadata && mergedMetadata && Object.keys(mergedMetadata).length
        ? (mergedMetadata as Prisma.InputJsonValue)
        : shouldMergeMetadata
          ? Prisma.JsonNull
          : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      let documentTypeId = template.documentTypeId;
      let categoryId = template.categoryId;

      if (data.documentType) {
        const documentType = await tx.documentType.upsert({
          where: { name: data.documentType.name },
          update: { nameAr: data.documentType.nameAr ?? null },
          create: { name: data.documentType.name, nameAr: data.documentType.nameAr ?? null },
        });
        documentTypeId = documentType.id;
      }

      if (data.category) {
        const category = await tx.documentCategory.upsert({
          where: {
            name_documentTypeId: {
              name: data.category.name,
              documentTypeId,
            },
          },
          update: { nameAr: data.category.nameAr ?? null },
          create: {
            name: data.category.name,
            nameAr: data.category.nameAr ?? null,
            documentTypeId,
          },
        });
        categoryId = category.id;
      }

      const updatedTemplate = await tx.documentTemplate.update({
        where: { id: template.id },
        data: {
          title: data.title ?? undefined,
          titleAr: data.titleAr === undefined ? undefined : data.titleAr,
          description: data.description === undefined ? undefined : data.description,
          locale: data.locale ?? undefined,
          language: data.language ?? undefined,
          version:
            data.version ??
            (data.isActive === true && !template.isActive ? template.version + 1 : undefined),
          isActive: data.isActive ?? undefined,
          metadata: metadataValue,
          assetId: data.assetId === undefined ? undefined : data.assetId,
          content: data.contentHtml === undefined ? undefined : data.contentHtml,
          documentTypeId,
          categoryId,
        },
      });

      if (data.fields?.length) {
        if (data.replaceFields) {
          await tx.templateField.deleteMany({ where: { templateId: template.id } });
        }

        for (const field of data.fields) {
          const fieldType = await tx.fieldType.upsert({
            where: { name: field.fieldType },
            update: { nameAr: null },
            create: { name: field.fieldType },
          });

          await tx.templateField.upsert({
            where: {
              templateId_fieldName: {
                templateId: template.id,
                fieldName: field.fieldName,
              },
            },
            update: {
              fieldLabel: field.fieldLabel,
              fieldLabelAr: field.fieldLabelAr ?? null,
              fieldTypeId: fieldType.id,
              isRequired: field.isRequired ?? false,
              defaultValue: field.defaultValue ?? null,
              validationRules: toNullableJsonInput(field.validationRules),
              placeholder: field.placeholder ?? null,
              placeholderAr: field.placeholderAr ?? null,
              helpText: field.helpText ?? null,
              helpTextAr: field.helpTextAr ?? null,
              dataSource: field.dataSource ?? null,
              participantRoleKey: field.participantRoleKey ?? null,
              allowMultiple: field.allowMultiple ?? false,
              section: field.section ?? null,
              sectionAr: field.sectionAr ?? null,
              displayOrder: field.displayOrder ?? 0,
              metadata: toNullableJsonInput(field.metadata),
            },
            create: {
              templateId: template.id,
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              fieldLabelAr: field.fieldLabelAr ?? null,
              fieldTypeId: fieldType.id,
              isRequired: field.isRequired ?? false,
              defaultValue: field.defaultValue ?? null,
              validationRules: toNullableJsonInput(field.validationRules),
              placeholder: field.placeholder ?? null,
              placeholderAr: field.placeholderAr ?? null,
              helpText: field.helpText ?? null,
              helpTextAr: field.helpTextAr ?? null,
              dataSource: field.dataSource ?? null,
              participantRoleKey: field.participantRoleKey ?? null,
              allowMultiple: field.allowMultiple ?? false,
              section: field.section ?? null,
              sectionAr: field.sectionAr ?? null,
              displayOrder: field.displayOrder ?? 0,
              metadata: toNullableJsonInput(field.metadata),
            },
          });
        }
      }

      if (data.participantRoles?.length) {
        if (data.replaceParticipantRoles) {
          await tx.templateParticipantRole.deleteMany({ where: { templateId: template.id } });
        }

        for (const role of data.participantRoles) {
          await tx.templateParticipantRole.upsert({
            where: {
              templateId_roleKey: {
                templateId: template.id,
                roleKey: role.roleKey,
              },
            },
            update: {
              roleLabel: role.roleLabel,
              roleLabelAr: role.roleLabelAr ?? null,
              description: role.description ?? null,
              isRequired: role.isRequired ?? true,
              minParticipants: role.minParticipants ?? 1,
              maxParticipants: role.maxParticipants ?? null,
              displayOrder: role.displayOrder ?? 0,
            },
            create: {
              templateId: template.id,
              roleKey: role.roleKey,
              roleLabel: role.roleLabel,
              roleLabelAr: role.roleLabelAr ?? null,
              description: role.description ?? null,
              isRequired: role.isRequired ?? true,
              minParticipants: role.minParticipants ?? 1,
              maxParticipants: role.maxParticipants ?? null,
              displayOrder: role.displayOrder ?? 0,
            },
          });
        }
      }

      return updatedTemplate;
    });

    const updateTemplateActivity = await prisma.activityType.findFirst({
      where: { name: "UPDATE_TEMPLATE" },
      select: { id: true },
    });
    if (updateTemplateActivity) {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: updateTemplateActivity.id,
          resourceType: "DocumentTemplate",
          resourceId: updated.id,
        },
      });
    }

    return NextResponse.json({ id: updated.id, slug: updated.slug });
  } catch (error) {
    console.error("Error updating template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  const { slug } = await params;

  try {
    const template = await prisma.documentTemplate.findUnique({ where: { slug } });
    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    await prisma.documentTemplate.delete({ where: { id: template.id } });

    const updateTemplateActivity = await prisma.activityType.findFirst({
      where: { name: "UPDATE_TEMPLATE" },
      select: { id: true },
    });
    if (updateTemplateActivity) {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: updateTemplateActivity.id,
          resourceType: "DocumentTemplate",
          resourceId: template.id,
        },
      });
    }

    return NextResponse.json({ message: "Template deleted" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
