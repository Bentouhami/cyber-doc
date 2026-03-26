import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { ensureAdminUser } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function toNullableJsonInput(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

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
  const normalized = slugifyBase(base) || "template-copy";
  let slug = normalized;
  let counter = 1;

  while (await prisma.documentTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    counter += 1;
    slug = `${normalized}-${counter}`;
  }

  return slug;
}

async function ensureUniqueTitle(baseTitle: string, documentTypeId: number, categoryId: number) {
  let title = baseTitle;
  let counter = 1;

  while (
    await prisma.documentTemplate.findFirst({
      where: {
        title,
        documentTypeId,
        categoryId,
      },
      select: { id: true },
    })
  ) {
    counter += 1;
    title = `${baseTitle} ${counter}`;
  }

  return title;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;
  const { slug } = await params;

  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { slug },
      include: {
        participantRoles: true,
        fields: true,
        fieldGroups: true,
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const baseTitle = `${template.title} (Copie)`;
    const nextTitle = await ensureUniqueTitle(
      baseTitle,
      template.documentTypeId,
      template.categoryId,
    );
    const nextSlug = await ensureUniqueSlug(`${template.slug}-copy`);

    const metadata =
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as Record<string, unknown>)
        : {};

    const nextMetadata = {
      ...metadata,
      reviewStatus: "DRAFT",
      sourceTemplateId: template.id,
      duplicatedByUserId: currentUser.id,
      duplicatedAt: new Date().toISOString(),
      archivedAt: null,
      archivedByUserId: null,
      reviewComment: null,
    };

    const created = await prisma.$transaction(async (tx) => {
      const duplicatedTemplate = await tx.documentTemplate.create({
        data: {
          slug: nextSlug,
          title: nextTitle,
          titleAr: template.titleAr ? `${template.titleAr} (نسخة)` : null,
          description: template.description,
          documentTypeId: template.documentTypeId,
          categoryId: template.categoryId,
          locale: template.locale,
          language: template.language,
          version: 1,
          isActive: false,
          metadata: nextMetadata,
          content: template.content,
          assetId: template.assetId,
        },
      });

      if (template.participantRoles.length) {
        await tx.templateParticipantRole.createMany({
          data: template.participantRoles.map((role) => ({
            templateId: duplicatedTemplate.id,
            roleKey: role.roleKey,
            roleLabel: role.roleLabel,
            roleLabelAr: role.roleLabelAr,
            description: role.description,
            isRequired: role.isRequired,
            minParticipants: role.minParticipants,
            maxParticipants: role.maxParticipants,
            displayOrder: role.displayOrder,
          })),
        });
      }

      if (template.fields.length) {
        await tx.templateField.createMany({
          data: template.fields.map((field) => ({
            templateId: duplicatedTemplate.id,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            fieldLabelAr: field.fieldLabelAr,
            placeholder: field.placeholder,
            placeholderAr: field.placeholderAr,
            fieldTypeId: field.fieldTypeId,
            isRequired: field.isRequired,
            defaultValue: field.defaultValue,
            validationRules: toNullableJsonInput(field.validationRules),
            helpText: field.helpText,
            helpTextAr: field.helpTextAr,
            dataSource: field.dataSource,
            participantRoleKey: field.participantRoleKey,
            groupFieldId: field.groupFieldId,
            options: toNullableJsonInput(field.options),
            uiSchema: toNullableJsonInput(field.uiSchema),
            allowMultiple: field.allowMultiple,
            metadata: toNullableJsonInput(field.metadata),
            section: field.section,
            sectionAr: field.sectionAr,
            displayOrder: field.displayOrder,
            notes: field.notes,
            isActive: field.isActive,
          })),
        });
      }

      if (template.fieldGroups.length) {
        await tx.templateFieldGroupAssignment.createMany({
          data: template.fieldGroups.map((group) => ({
            templateId: duplicatedTemplate.id,
            groupId: group.groupId,
            displayOrder: group.displayOrder,
            isRequired: group.isRequired,
            notes: group.notes,
          })),
        });
      }

      return duplicatedTemplate;
    });

    return NextResponse.json(
      {
        message: "Template duplicated.",
        templateId: created.id,
        slug: created.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error duplicating template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
