import { Metadata } from "next"

import prisma from "@/lib/prisma"
import { TemplateWorkbench } from "@/components/templates/template-workbench"
import type { GenerationTemplate } from "@/components/templates/template-form"

export const metadata: Metadata = {
  title: "Génération de documents",
}

type PageProps = {
  searchParams?: { documentId?: string | string[] } | Promise<{ documentId?: string | string[] }>
}

export default async function DocumentCreatePage({ searchParams }: PageProps) {
  const prismaAny = prisma as any
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined
  const documentId = Array.isArray(resolvedSearchParams?.documentId)
    ? resolvedSearchParams?.documentId[0]
    : resolvedSearchParams?.documentId
  let initialTemplateId: string | undefined
  let initialValues: Record<string, string> | undefined
  let initialParticipants:
    | Record<string, { fullName?: string; nationalId?: string; phone?: string }>
    | undefined
  let initialPayment: { copies?: number; amountPaid?: number } | undefined

  if (documentId) {
    const document = await prismaAny.document.findUnique({
      where: { id: documentId },
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
        participants: {
          include: {
            persona: true,
          },
        },
      },
    })
    if (document) {
      initialTemplateId = document.templateId
      initialValues = {}
      for (const fieldValue of document.fieldValues as any[]) {
        const fieldName = fieldValue.field?.fieldName
        if (!fieldName) continue
        if (Array.isArray(fieldValue.valueJson)) {
          initialValues[fieldName] = fieldValue.valueJson.join("\n")
        } else if (fieldValue.valueJson !== null && fieldValue.valueJson !== undefined) {
          initialValues[fieldName] = String(fieldValue.valueJson)
        } else {
          initialValues[fieldName] = fieldValue.value ?? ""
        }
      }
      initialParticipants = {}
      for (const participant of document.participants as any[]) {
        initialParticipants[participant.roleKey] = {
          fullName: participant.persona?.fullName ?? "",
          nationalId: participant.persona?.nationalId ?? "",
          phone: participant.persona?.phone ?? "",
        }
      }
      initialPayment = {
        copies: document.totalCopies ?? 1,
        amountPaid: document.amountPaid ? Number(document.amountPaid) : undefined,
      }
    }
  }

  const templates = (await prismaAny.documentTemplate.findMany({
    where: {
      isActive: true,
      AND: [{ content: { not: null } }, { content: { not: "" } }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      titleAr: true,
      locale: true,
      metadata: true,
      participantRoles: true,
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
  })) as any[]

  const generationTemplates: GenerationTemplate[] = templates.map((template) => ({
    id: template.id,
    slug: template.slug,
    title: template.title,
    titleAr: template.titleAr,
    locale: template.locale,
    basePrice:
      template.metadata && typeof template.metadata === "object"
        ? (template.metadata as any).basePrice ?? null
        : null,
    participantRoles: template.participantRoles?.map((role: any) => ({
      roleKey: role.roleKey,
      roleLabel: role.roleLabel,
      roleLabelAr: role.roleLabelAr,
    })),
    fields: template.fields
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((field: any) => {
        const section =
          field.sectionAr ||
          field.section ||
          field.groupField?.group?.nameAr ||
          field.groupField?.group?.name ||
          null

        const options = Array.isArray(field.options)
          ? field.options.map((option: unknown) => option?.toString?.() || String(option))
          : null

        return {
          id: field.id,
          name: field.fieldName,
          label: field.fieldLabel,
          labelAr: field.fieldLabelAr,
          type: field.fieldType.name,
          isRequired: field.isRequired,
          allowMultiple: field.allowMultiple,
          section,
          options,
          helpText: field.helpTextAr || field.helpText,
          helpTextAr: field.helpTextAr,
          dataSource: field.dataSource ?? null,
          participantRoleKey: field.participantRoleKey ?? null,
        }
      }),
  }))

  return (
    <div className="container mx-auto py-10">
      <TemplateWorkbench
        templates={generationTemplates}
        initialTemplateId={initialTemplateId}
        initialValues={initialValues}
        initialParticipants={initialParticipants}
        initialPayment={initialPayment}
        initialDocumentId={documentId}
      />
    </div>
  )
}
