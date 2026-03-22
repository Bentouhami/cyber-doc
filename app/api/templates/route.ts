import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { ensureAdminUser, getAuthenticatedUser } from "@/lib/admin-auth";
import { findTemplateDuplicateCandidates } from "@/services/templateDuplicateService";

const templateCreateSchema = z.object({
  slug: z.string().min(1).optional(),
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
  documentType: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
  category: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
  fields: z
    .array(
      z.object({
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
      }),
    )
    .optional(),
  assetId: z.string().optional(),
  forceDuplicateOverride: z.boolean().optional(),
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
  const normalized = slugifyBase(base) || "template";
  const seed = `${normalized}-${Date.now().toString(36)}`;
  let slug = seed;
  let counter = 1;

  while (await prisma.documentTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${seed}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function ensureUniqueTitleForScope(
  tx: Prisma.TransactionClient,
  baseTitle: string,
  documentTypeId: number,
  categoryId: number,
) {
  let title = baseTitle;
  let counter = 1;

  while (
    await tx.documentTemplate.findFirst({
      where: {
        title,
        documentTypeId,
        categoryId,
      },
      select: { id: true },
    })
  ) {
    counter += 1;
    title = `${baseTitle} (${counter})`;
  }

  return title;
}

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers);
  if ("error" in authResult) {
    return authResult.error;
  }

  const url = new URL(request.url);
  const onlyActive = url.searchParams.get("active") !== "false";
  const includeFields = url.searchParams.get("withFields") === "true";
  const includeRoles = url.searchParams.get("withRoles") === "true";
  const includeAsset = url.searchParams.get("withAsset") === "true";

  try {
    const templates = (await prisma.documentTemplate.findMany({
      where: {
        ...(onlyActive ? { isActive: true } : {}),
      },
      include: {
        fields: includeFields
          ? {
              include: {
                fieldType: true,
                groupField: {
                  include: { group: true },
                },
              },
              orderBy: { displayOrder: "asc" },
            }
          : false,
        participantRoles: includeRoles ? { orderBy: { displayOrder: "asc" } } : false,
        asset: includeAsset ? true : false,
      },
      orderBy: { updatedAt: "desc" },
    })) as any[];

    return NextResponse.json(
      templates.map((template) => ({
        id: template.id,
        slug: template.slug,
        title: template.title,
        titleAr: template.titleAr,
        description: template.description,
        locale: template.locale,
        version: template.version,
        isActive: template.isActive,
        fields: includeFields
          ? template.fields.map((field: any) => ({
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
            }))
          : undefined,
        participantRoles: includeRoles
          ? template.participantRoles.map((role: any) => ({
              roleKey: role.roleKey,
              roleLabel: role.roleLabel,
              roleLabelAr: role.roleLabelAr,
              isRequired: role.isRequired,
              minParticipants: role.minParticipants,
              maxParticipants: role.maxParticipants,
            }))
          : undefined,
        asset: includeAsset
          ? template.asset
            ? {
                id: template.asset.id,
                fileName: template.asset.fileName,
                filePath: template.asset.filePath,
              }
            : null
          : undefined,
        updatedAt: template.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Error fetching templates:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdminUser(request.headers);
  if ("error" in adminCheck) {
    return adminCheck.error;
  }
  const { currentUser } = adminCheck;

  let data: z.infer<typeof templateCreateSchema>;
  try {
    const body = await request.json();
    const parsed = templateCreateSchema.safeParse(body);
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
    const duplicateCandidates = await findTemplateDuplicateCandidates(prisma, {
      title: data.title,
      locale: data.locale,
      documentTypeName: data.documentType.name,
      categoryName: data.category.name,
    });

    if (duplicateCandidates.length > 0 && !data.forceDuplicateOverride) {
      return NextResponse.json(
        {
          code: "DUPLICATE_CANDIDATE",
          message: "Potential duplicate templates detected",
          candidates: duplicateCandidates,
        },
        { status: 409 },
      );
    }

    const requestedSlug = data.slug?.trim();
    const fallbackSlugBase = `${data.documentType.name}-${data.category.name}-${data.title}`;
    const finalSlug = requestedSlug?.length
      ? await ensureUniqueSlug(requestedSlug)
      : await ensureUniqueSlug(fallbackSlugBase);

    const mergedMetadata = {
      ...(data.metadata ?? {}),
      ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
      ...(data.contentCss !== undefined ? { htmlCss: data.contentCss } : {}),
      ...(data.pdfOptions !== undefined ? { pdfOptions: data.pdfOptions } : {}),
    };
    const nextMetadata = Object.keys(mergedMetadata).length
      ? (mergedMetadata as Prisma.InputJsonValue)
      : undefined;

    const template = await prisma.$transaction(async (tx) => {
      const documentType = await tx.documentType.upsert({
        where: { name: data.documentType.name },
        update: {
          nameAr: data.documentType.nameAr ?? null,
        },
        create: {
          name: data.documentType.name,
          nameAr: data.documentType.nameAr ?? null,
        },
      });

      const category = await tx.documentCategory.upsert({
        where: {
          name_documentTypeId: {
            name: data.category.name,
            documentTypeId: documentType.id,
          },
        },
        update: {
          nameAr: data.category.nameAr ?? null,
        },
        create: {
          name: data.category.name,
          nameAr: data.category.nameAr ?? null,
          documentTypeId: documentType.id,
        },
      });

      const finalTitle = data.forceDuplicateOverride
        ? await ensureUniqueTitleForScope(
            tx,
            data.title,
            documentType.id,
            category.id,
          )
        : data.title;

      const createdTemplate = await tx.documentTemplate.create({
        data: {
          slug: finalSlug,
          title: finalTitle,
          titleAr: data.titleAr ?? null,
          description: data.description ?? null,
          documentTypeId: documentType.id,
          categoryId: category.id,
          locale: data.locale ?? "ar-MA",
          language: data.language ?? "fr",
          version: data.version ?? 1,
          isActive: data.isActive ?? true,
          metadata: nextMetadata,
          assetId: data.assetId ?? null,
          content: data.contentHtml ?? null,
        },
      });

      if (data.fields?.length) {
        for (const field of data.fields) {
          const fieldType = await tx.fieldType.upsert({
            where: { name: field.fieldType },
            update: { nameAr: null },
            create: { name: field.fieldType },
          });

          await tx.templateField.create({
            data: {
              templateId: createdTemplate.id,
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              fieldLabelAr: field.fieldLabelAr ?? null,
              fieldTypeId: fieldType.id,
              isRequired: field.isRequired ?? false,
              defaultValue: field.defaultValue ?? null,
              validationRules:
                field.validationRules === undefined
                  ? undefined
                  : (field.validationRules as Prisma.InputJsonValue),
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
              metadata:
                field.metadata === undefined
                  ? undefined
                  : (field.metadata as Prisma.InputJsonValue),
            },
          });
        }
      }

      return createdTemplate;
    });

    const createTemplateActivity = await prisma.activityType.findFirst({
      where: { name: "CREATE_TEMPLATE" },
      select: { id: true },
    });
    if (createTemplateActivity) {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: createTemplateActivity.id,
          resourceType: "DocumentTemplate",
          resourceId: template.id,
        },
      });
    }

    return NextResponse.json(
      {
        id: template.id,
        slug: template.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
