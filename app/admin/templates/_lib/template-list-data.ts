import type { TemplateListItem } from "@/components/admin/templates/template-list";
import prisma from "@/lib/prisma";

type GetTemplateListOptions = {
  pendingOnly?: boolean;
};

export async function getAdminTemplateListData(options?: GetTemplateListOptions) {
  const prismaAny = prisma as any;

  const templates = (await prismaAny.documentTemplate.findMany({
    include: {
      documentType: true,
      category: true,
      asset: true,
      participantRoles: true,
      fields: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })) as any[];

  const requestedByIds = Array.from(
    new Set(
      templates
        .map((template) => {
          if (!template.metadata || typeof template.metadata !== "object") return null;
          return (template.metadata as Record<string, unknown>)
            .requestedByUserId as string | undefined;
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const requesters = requestedByIds.length
    ? (await prismaAny.user.findMany({
        where: { id: { in: requestedByIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
        },
      })) as Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        name: string | null;
        email: string;
      }>
    : [];

  const requesterById = new Map(
    requesters.map((user) => {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      const displayName = fullName || user.name || user.email;
      return [user.id, displayName];
    }),
  );

  const serialized: TemplateListItem[] = templates.map((template: any) => ({
    id: template.id,
    slug: template.slug,
    title: template.title,
    titleAr: template.titleAr,
    description: template.description,
    locale: template.locale,
    version: template.version,
    isActive: template.isActive,
    hasHtml: Boolean(template.content),
    basePrice:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).basePrice ?? null
        : null,
    reviewStatus:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).reviewStatus ?? null
        : null,
    requestedByName:
      template.metadata && typeof template.metadata === "object"
        ? requesterById.get((template.metadata as any).requestedByUserId) ?? null
        : null,
    requestedAt:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).requestedAt ?? null
        : null,
    reviewComment:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).reviewComment ?? null
        : null,
    archivedAt:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).archivedAt ?? null
        : null,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
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
          fileName: template.asset.fileName,
          version: template.asset.version,
        }
      : null,
    participantRoles: template.participantRoles.map((role: any) => ({
      roleKey: role.roleKey,
      roleLabel: role.roleLabel,
      roleLabelAr: role.roleLabelAr,
      description: role.description,
      isRequired: role.isRequired,
      minParticipants: role.minParticipants,
      maxParticipants: role.maxParticipants,
    })),
    fieldCount: template.fields.length,
  }));

  if (options?.pendingOnly) {
    return serialized.filter((template) => template.reviewStatus === "PENDING");
  }

  return serialized;
}

