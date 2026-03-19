import { Metadata } from "next"

import { TemplateList, TemplateListItem } from "@/components/admin/templates/template-list"
import prisma from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Gestion des modèles",
}

export default async function AdminTemplatesPage() {
  const prismaAny = prisma as any

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
  })) as any[]

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
  }))

  return <TemplateList templates={serialized} />
}
