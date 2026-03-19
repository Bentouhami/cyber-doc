import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { ensureAdminUser, getAuthenticatedUser } from "@/lib/admin-auth";

const templateCreateSchema = z.object({
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
  assetId: z.string().optional(),
});

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
    const templates = await prisma.documentTemplate.findMany({
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
    });

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
          ? template.fields.map((field) => ({
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
          ? template.participantRoles.map((role) => ({
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
    const mergedMetadata = {
      ...(data.metadata ?? {}),
      ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
      ...(data.contentCss !== undefined ? { htmlCss: data.contentCss } : {}),
      ...(data.pdfOptions !== undefined ? { pdfOptions: data.pdfOptions } : {}),
    };
    const nextMetadata = Object.keys(mergedMetadata).length ? mergedMetadata : null;

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

      return tx.documentTemplate.create({
        data: {
          slug: data.slug,
          title: data.title,
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
    });

    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        activityType: {
          connect: { name: "CREATE_TEMPLATE" },
        },
        resourceType: "DocumentTemplate",
        resourceId: template.id,
      },
    });

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
