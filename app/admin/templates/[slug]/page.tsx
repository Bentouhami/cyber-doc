import { Metadata } from "next"
import { notFound } from "next/navigation"

import { TemplateDetail, TemplateDetailData } from "@/components/admin/templates/template-detail"
import prisma from "@/lib/prisma"

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const prismaAny = prisma as any
  const template = await prismaAny.documentTemplate.findUnique({
    where: { slug },
    select: { title: true, titleAr: true },
  })

  if (!template) {
    return { title: "Modèle introuvable" }
  }

  return {
    title: template.titleAr || template.title,
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params
  const prismaAny = prisma as any

  const template = await prismaAny.documentTemplate.findUnique({
    where: { slug },
    include: {
      documentType: true,
      category: true,
      asset: true,
      participantRoles: true,
      fieldGroups: {
        include: {
          group: {
            include: {
              fields: {
                include: {
                  fieldType: true,
                },
              },
            },
          },
        },
      },
      fields: {
        include: {
          fieldType: true,
          groupField: {
            include: {
              group: true,
            },
          },
        },
      },
    },
  })

  if (!template) {
    return notFound()
  }

  const record = template as any
  const templateMetadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : {}
  const requestedByUserId =
    typeof templateMetadata.requestedByUserId === "string"
      ? templateMetadata.requestedByUserId
      : null
  const reviewedByUserId =
    typeof templateMetadata.reviewedByUserId === "string"
      ? templateMetadata.reviewedByUserId
      : null
  const archivedByUserId =
    typeof templateMetadata.archivedByUserId === "string"
      ? templateMetadata.archivedByUserId
      : null
  const duplicatedByUserId =
    typeof templateMetadata.duplicatedByUserId === "string"
      ? templateMetadata.duplicatedByUserId
      : null

  const actorIds = Array.from(
    new Set(
      [requestedByUserId, reviewedByUserId, archivedByUserId, duplicatedByUserId].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  )

  const actors = actorIds.length
    ? (await prismaAny.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, firstName: true, lastName: true, name: true, email: true },
      })) as Array<{
        id: string
        firstName: string | null
        lastName: string | null
        name: string | null
        email: string
      }>
    : []

  const actorById = new Map(
    actors.map((user) => {
      const displayName =
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.name || user.email
      return [user.id, displayName]
    }),
  )

  const requestedByName = requestedByUserId ? actorById.get(requestedByUserId) ?? null : null

  const activityTimeline: TemplateDetailData["activityTimeline"] = []
  if (typeof templateMetadata.requestedAt === "string") {
    activityTimeline.push({
      type: "requested",
      at: templateMetadata.requestedAt,
      actorName: requestedByName,
    })
  }
  if (typeof templateMetadata.reviewedAt === "string") {
    const reviewStatus =
      typeof templateMetadata.reviewStatus === "string" ? templateMetadata.reviewStatus : null
    const reviewComment =
      typeof templateMetadata.reviewComment === "string" ? templateMetadata.reviewComment : null
    activityTimeline.push({
      type: "reviewed",
      at: templateMetadata.reviewedAt,
      actorName: reviewedByUserId ? actorById.get(reviewedByUserId) ?? null : null,
      note: [reviewStatus, reviewComment].filter(Boolean).join(" - ") || null,
    })
  }
  if (typeof templateMetadata.duplicatedAt === "string") {
    activityTimeline.push({
      type: "duplicated",
      at: templateMetadata.duplicatedAt,
      actorName: duplicatedByUserId ? actorById.get(duplicatedByUserId) ?? null : null,
    })
  }
  if (typeof templateMetadata.archivedAt === "string") {
    activityTimeline.push({
      type: "archived",
      at: templateMetadata.archivedAt,
      actorName: archivedByUserId ? actorById.get(archivedByUserId) ?? null : null,
    })
  }
  activityTimeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const detail: TemplateDetailData = {
    id: record.id,
    slug: record.slug,
    title: record.title,
    titleAr: record.titleAr,
    description: record.description,
    locale: record.locale,
    version: record.version,
    isActive: record.isActive,
    contentHtml: record.content,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    documentType: {
      name: record.documentType.name,
      nameAr: record.documentType.nameAr,
    },
    category: {
      name: record.category.name,
      nameAr: record.category.nameAr,
    },
    asset: record.asset
      ? {
          id: record.asset.id,
          fileName: record.asset.fileName,
          filePath: record.asset.filePath,
          version: record.asset.version,
        }
      : null,
    metadata: record.metadata as Record<string, unknown> | null,
    requestedByName,
    requestedAt:
      typeof templateMetadata.requestedAt === "string"
        ? templateMetadata.requestedAt
        : null,
    activityTimeline,
    participantRoles: (record.participantRoles as any[])
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((role: any) => ({
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        roleLabelAr: role.roleLabelAr,
        description: role.description,
        isRequired: role.isRequired,
        minParticipants: role.minParticipants,
        maxParticipants: role.maxParticipants,
      })),
    fieldGroups: (record.fieldGroups as any[])
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((assignment: any) => ({
        id: assignment.id,
        displayOrder: assignment.displayOrder,
        isRequired: assignment.isRequired,
        group: {
          code: assignment.group.code,
          name: assignment.group.name,
          nameAr: assignment.group.nameAr,
          description: assignment.group.description,
          fields: (assignment.group.fields as any[])
            .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((field: any) => ({
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              fieldLabelAr: field.fieldLabelAr,
              fieldType: field.fieldType.name,
              isRequired: field.isRequired,
            })),
        },
      })),
    fields: (record.fields as any[])
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((field: any) => ({
        id: field.id,
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldLabelAr: field.fieldLabelAr,
        fieldType: field.fieldType.name,
        isRequired: field.isRequired,
        allowMultiple: field.allowMultiple,
        section: field.section,
        sectionAr: field.sectionAr,
        dataSource: field.dataSource,
        participantRoleKey: field.participantRoleKey,
        displayOrder: field.displayOrder,
        groupCode: field.groupField?.group?.code ?? null,
      })),
  }

  return <TemplateDetail template={detail} />
}
