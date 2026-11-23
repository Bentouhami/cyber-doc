import type { Metadata } from "next"

import prisma from "@/lib/prisma"
import { TemplateWorkbench } from "@/components/templates/template-workbench"
import type { GenerationTemplate } from "@/components/templates/template-form"
import { DocumentCreateHeader } from "@/components/documents/document-create-header"
import { getServerLocale } from "@/lib/server-locale"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getServerLocale()) === "ar" ? "إنشاء وثيقة" : "Génération de documents",
  }
}

type PageProps = {
  searchParams?: Promise<{
    documentId?: string | string[]
    personaId?: string | string[]
    entryMode?: string | string[]
  }>
}

export default async function DocumentCreatePage({ searchParams }: PageProps) {
  const prismaAny = prisma as any
  const resolvedSearchParams = await searchParams
  const documentId = Array.isArray(resolvedSearchParams?.documentId)
    ? resolvedSearchParams?.documentId[0]
    : resolvedSearchParams?.documentId
  const personaId = Array.isArray(resolvedSearchParams?.personaId)
    ? resolvedSearchParams?.personaId[0]
    : resolvedSearchParams?.personaId
  const entryModeParam = Array.isArray(resolvedSearchParams?.entryMode)
    ? resolvedSearchParams?.entryMode[0]
    : resolvedSearchParams?.entryMode
  const entryMode =
    entryModeParam === "existing" || entryModeParam === "new"
      ? entryModeParam
      : undefined
  let initialTemplateId: string | undefined
  let initialValues: Record<string, string> | undefined
  let initialParticipants:
    | Record<
        string,
        {
          fullName?: string
          nationalId?: string
          phone?: string
          email?: string
          birthDate?: string
          birthPlace?: string
          addressLine1?: string
          city?: string
          gender?: string
          occupation?: string
          employer?: string
        }
      >
    | undefined
  let initialParticipantIds: Record<string, string> | undefined
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
      initialParticipantIds = {}
      for (const participant of document.participants as any[]) {
        initialParticipants[participant.roleKey] = {
          fullName: participant.persona?.fullName ?? "",
          nationalId: participant.persona?.nationalId ?? "",
          phone: participant.persona?.phone ?? "",
          email: participant.persona?.email ?? "",
          birthDate: participant.persona?.birthDate
            ? new Date(participant.persona.birthDate).toISOString().slice(0, 10)
            : "",
          birthPlace: participant.persona?.birthPlace ?? "",
          addressLine1: participant.persona?.addressLine1 ?? "",
          city: participant.persona?.city ?? "",
          gender: participant.persona?.gender ?? "",
          occupation: participant.persona?.occupation ?? "",
          employer: participant.persona?.employer ?? "",
        }
        if (participant.persona?.id) {
          initialParticipantIds[participant.roleKey] = participant.persona.id
        }
      }
      initialPayment = {
        copies: 1,
      }
    }
  }

  if (!documentId && personaId) {
    const persona = await prismaAny.persona.findUnique({
      where: { id: personaId },
      select: {
        fullName: true,
        nationalId: true,
        phone: true,
        email: true,
        birthDate: true,
        birthPlace: true,
        addressLine1: true,
        city: true,
        gender: true,
        occupation: true,
        employer: true,
      },
    })

    if (persona) {
      initialParticipants = {
        client: {
          fullName: persona.fullName ?? "",
          nationalId: persona.nationalId ?? "",
          phone: persona.phone ?? "",
          email: persona.email ?? "",
          birthDate: persona.birthDate
            ? new Date(persona.birthDate).toISOString().slice(0, 10)
            : "",
          birthPlace: persona.birthPlace ?? "",
          addressLine1: persona.addressLine1 ?? "",
          city: persona.city ?? "",
          gender: persona.gender ?? "",
          occupation: persona.occupation ?? "",
          employer: persona.employer ?? "",
        },
      }
      initialParticipantIds = {
        client: personaId,
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
      isRequired: role.isRequired,
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
    <section className="bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <DocumentCreateHeader isVersion={Boolean(documentId)} />

        <TemplateWorkbench
          templates={generationTemplates}
          initialTemplateId={initialTemplateId}
          initialValues={initialValues}
          initialParticipants={initialParticipants}
          initialParticipantIds={initialParticipantIds}
          initialPayment={initialPayment}
          initialDocumentId={documentId}
          entryMode={entryMode}
        />
      </div>
    </section>
  )
}
