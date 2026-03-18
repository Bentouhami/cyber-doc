import type { PrismaClient, Prisma } from "@prisma/client";

export type TemplateImportDocumentType = {
  name: string;
  nameAr?: string | null;
};

export type TemplateImportCategory = {
  name: string;
  nameAr?: string | null;
};

export type TemplateImportAsset = {
  fileName: string;
  filePath: string;
  fileType?: string | null;
  fileSize?: number | null;
  storageDriver?: string | null;
  checksum?: string | null;
  version?: number | null;
  metadata?: Prisma.JsonValue | null;
};

export type TemplateImportParticipantRole = {
  roleKey: string;
  roleLabel: string;
  roleLabelAr?: string | null;
  description?: string | null;
  isRequired?: boolean | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
  displayOrder?: number | null;
};

export type TemplateImportField = {
  fieldName: string;
  fieldLabel: string;
  fieldLabelAr?: string | null;
  fieldType: string;
  isRequired?: boolean | null;
  defaultValue?: string | null;
  validationRules?: Prisma.JsonValue | null;
  placeholder?: string | null;
  placeholderAr?: string | null;
  helpText?: string | null;
  helpTextAr?: string | null;
  dataSource?: string | null;
  participantRoleKey?: string | null;
  allowMultiple?: boolean | null;
  section?: string | null;
  sectionAr?: string | null;
  displayOrder?: number | null;
  metadata?: Prisma.JsonValue | null;
};

export type TemplateImportGroupAssignment = {
  groupCode: string;
  displayOrder?: number | null;
  isRequired?: boolean | null;
};

export type TemplateImportPayload = {
  slug: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  locale?: string | null;
  language?: string | null;
  version?: number | null;
  isActive?: boolean | null;
  metadata?: Prisma.JsonValue | null;
  contentHtml?: string | null;
  contentCss?: string | null;
  pdfOptions?: Prisma.JsonValue | null;
  documentType: TemplateImportDocumentType;
  category: TemplateImportCategory;
  asset?: TemplateImportAsset | null;
  participantRoles?: TemplateImportParticipantRole[] | null;
  fields?: TemplateImportField[] | null;
  groupAssignments?: TemplateImportGroupAssignment[] | null;
};

export async function importTemplateWithAsset(
  prisma: PrismaClient,
  payload: TemplateImportPayload,
) {
  return prisma.$transaction(async (tx) => {
    const documentType = await tx.documentType.upsert({
      where: { name: payload.documentType.name },
      update: {
        nameAr: payload.documentType.nameAr ?? null,
      },
      create: {
        name: payload.documentType.name,
        nameAr: payload.documentType.nameAr ?? null,
      },
    });

    const category = await tx.documentCategory.upsert({
      where: {
        name_documentTypeId: {
          name: payload.category.name,
          documentTypeId: documentType.id,
        },
      },
      update: {
        nameAr: payload.category.nameAr ?? null,
      },
      create: {
        name: payload.category.name,
        nameAr: payload.category.nameAr ?? null,
        documentTypeId: documentType.id,
      },
    });

    let assetId: string | null = null;
    if (payload.asset) {
      const assetVersion = payload.asset.version ?? 1;
      const asset = await tx.templateAsset.upsert({
        where: {
          filePath_version: {
            filePath: payload.asset.filePath,
            version: assetVersion,
          },
        },
        update: {
          fileName: payload.asset.fileName,
          fileType:
            payload.asset.fileType ??
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: payload.asset.fileSize ?? null,
          storageDriver: payload.asset.storageDriver ?? "local",
          checksum: payload.asset.checksum ?? null,
          metadata: payload.asset.metadata ?? null,
        },
        create: {
          fileName: payload.asset.fileName,
          filePath: payload.asset.filePath,
          fileType:
            payload.asset.fileType ??
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: payload.asset.fileSize ?? null,
          storageDriver: payload.asset.storageDriver ?? "local",
          checksum: payload.asset.checksum ?? null,
          version: assetVersion,
          metadata: payload.asset.metadata ?? null,
        },
      });
      assetId = asset.id;
    }

    const mergedMetadata = {
      ...(payload.metadata ?? {}),
      ...(payload.contentCss !== undefined ? { htmlCss: payload.contentCss } : {}),
      ...(payload.pdfOptions !== undefined ? { pdfOptions: payload.pdfOptions } : {}),
    };
    const nextMetadata = Object.keys(mergedMetadata).length ? mergedMetadata : null;

    const template = await tx.documentTemplate.upsert({
      where: { slug: payload.slug },
      update: {
        title: payload.title,
        titleAr: payload.titleAr ?? null,
        description: payload.description ?? null,
        documentTypeId: documentType.id,
        categoryId: category.id,
        locale: payload.locale ?? "ar-MA",
        language: payload.language ?? "fr",
        version: payload.version ?? 1,
        isActive: payload.isActive ?? true,
        metadata: nextMetadata,
        assetId,
        content: payload.contentHtml ?? null,
      },
      create: {
        slug: payload.slug,
        title: payload.title,
        titleAr: payload.titleAr ?? null,
        description: payload.description ?? null,
        documentTypeId: documentType.id,
        categoryId: category.id,
        locale: payload.locale ?? "ar-MA",
        language: payload.language ?? "fr",
        version: payload.version ?? 1,
        isActive: payload.isActive ?? true,
        metadata: nextMetadata,
        assetId,
        content: payload.contentHtml ?? null,
      },
    });

    if (payload.participantRoles?.length) {
      for (const role of payload.participantRoles) {
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

    if (payload.groupAssignments?.length) {
      for (const assignment of payload.groupAssignments) {
        const group = await tx.templateFieldGroup.findUnique({
          where: { code: assignment.groupCode },
        });
        if (!group) {
          throw new Error(`Template field group not found: ${assignment.groupCode}`);
        }

        await tx.templateFieldGroupAssignment.upsert({
          where: {
            templateId_groupId: {
              templateId: template.id,
              groupId: group.id,
            },
          },
          update: {
            displayOrder: assignment.displayOrder ?? 0,
            isRequired: assignment.isRequired ?? false,
          },
          create: {
            templateId: template.id,
            groupId: group.id,
            displayOrder: assignment.displayOrder ?? 0,
            isRequired: assignment.isRequired ?? false,
          },
        });
      }
    }

    if (payload.fields?.length) {
      for (const field of payload.fields) {
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
            validationRules: field.validationRules ?? null,
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
            metadata: field.metadata ?? null,
          },
          create: {
            templateId: template.id,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            fieldLabelAr: field.fieldLabelAr ?? null,
            fieldTypeId: fieldType.id,
            isRequired: field.isRequired ?? false,
            defaultValue: field.defaultValue ?? null,
            validationRules: field.validationRules ?? null,
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
            metadata: field.metadata ?? null,
          },
        });
      }
    }

    return template;
  });
}
