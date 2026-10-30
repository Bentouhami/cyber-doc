import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import fs from "node:fs/promises"
import { randomUUID } from "node:crypto"

import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/admin-auth"
import { internalServerError, logApiError } from "@/lib/api-error"
import { hasAnyRole } from "@/lib/permissions"
import { incrementDailyStats } from "@/services/dailyStatsService"
import {
  buildDocumentStoragePath,
  writeDocumentFileAtomically,
} from "@/services/documentStorageService"
import {
  buildNestedPayload,
  generatePdfBufferFromHtml,
  renderHtmlTemplate,
} from "@/services/documentRenderService"
import { validateDocumentLanguage } from "@/lib/document-language-guard"
import {
  hasParticipantIdentity,
  validateParticipantSubmission,
} from "@/lib/document-generation-policy"
import { calculatePaymentState, paymentUpdateSchema } from "@/lib/payment-policy"

export const runtime = "nodejs"

const requestSchema = z.object({
  templateId: z.string().min(1, "templateId is required"),
  slug: z.string().min(1, "slug is required"),
  locale: z.string().min(2, "locale is required"),
  sourceDocumentId: z.string().optional(),
  payload: z.record(z.string(), z.json()).default({}),
  copies: z.number().int().min(1).optional(),
  amountPaid: z.number().finite().nonnegative().optional(),
  languageOverrideConfirmed: z.boolean().optional(),
  participants: z
    .array(
      z.object({
        roleKey: z.string().min(1),
        roleLabel: z.string().optional(),
        personaId: z.string().optional(),
        persona: z
          .object({
            fullName: z.string().optional(),
            fullNameAr: z.string().optional(),
            nationalId: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().optional(),
            // Accept both full ISO datetime and date-only values from UI date pickers.
            birthDate: z.string().optional(),
            birthPlace: z.string().optional(),
            addressLine1: z.string().optional(),
            city: z.string().optional(),
            gender: z.string().optional(),
            occupation: z.string().optional(),
            employer: z.string().optional(),
            locale: z.string().optional(),
            notes: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
})

type TemplateFieldWithMeta = Prisma.TemplateFieldGetPayload<{
  select: {
    id: true
    fieldName: true
    fieldLabel: true
    fieldLabelAr: true
    isRequired: true
    allowMultiple: true
    dataSource: true
    participantRoleKey: true
  }
}>

type NormalizedFieldValue = {
  fieldId: string
  fieldName: string
  value: string
  valueJson?: Prisma.InputJsonValue
}

function normalizeTemplateValues(
  fields: TemplateFieldWithMeta[],
  payload: Record<string, unknown>,
): NormalizedFieldValue[] {
  const normalized: NormalizedFieldValue[] = []

  for (const field of fields) {
    const rawValue = payload[field.fieldName]

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (field.isRequired) {
        throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`)
      }
      continue
    }

    if (field.allowMultiple) {
      let values: string[] = []

      if (Array.isArray(rawValue)) {
        values = rawValue.map((value) => value?.toString?.().trim()).filter(Boolean) as string[]
      } else if (typeof rawValue === "string") {
        values = rawValue
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean)
      } else {
        values = [String(rawValue)]
      }

      if (!values.length) {
        if (field.isRequired) {
          throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`)
        }
        continue
      }

      normalized.push({
        fieldId: field.id,
        fieldName: field.fieldName,
        value: values.join("\n"),
        valueJson: values,
      })
      continue
    }

    const stringValue = (() => {
      if (typeof rawValue === "string") return rawValue
      if (typeof rawValue === "number" || typeof rawValue === "boolean") return rawValue.toString()
      if (rawValue instanceof Date) return rawValue.toISOString()
      try {
        return JSON.stringify(rawValue)
      } catch {
        return String(rawValue)
      }
    })()

    if (!stringValue && field.isRequired) {
      throw new Error(`Missing required field: ${field.fieldLabelAr || field.fieldLabel}`)
    }

    const jsonValue =
      typeof rawValue === "string" || rawValue === null || rawValue === undefined
        ? undefined
        : (rawValue as Prisma.InputJsonValue)

    normalized.push({
      fieldId: field.id,
      fieldName: field.fieldName,
      value: stringValue,
      valueJson: jsonValue,
    })
  }

  return normalized
}

type ParticipantPersonaInput = {
  fullName?: string
  fullNameAr?: string
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
  locale?: string
  notes?: string
}

function normalizeString(value: unknown) {
  if (value === undefined || value === null) return undefined
  const normalized = String(value).trim()
  return normalized.length ? normalized : undefined
}

function inferPersonaKey(fieldName: string, dataSource?: string | null) {
  const source = `${fieldName}.${dataSource ?? ""}`.toLowerCase()
  if (source.includes("fullnamear")) return "fullNameAr" as const
  if (source.includes("fullname")) return "fullName" as const
  if (source.includes("nationalid") || source.includes("cin")) return "nationalId" as const
  if (source.includes("phone") || source.includes("tel")) return "phone" as const
  if (source.includes("email") || source.includes("mail")) return "email" as const
  if (source.includes("birthdate") || source.includes("dateofbirth")) return "birthDate" as const
  if (source.includes("birthplace") || source.includes("placeofbirth")) return "birthPlace" as const
  if (source.includes("addressline1") || source.includes("address")) return "addressLine1" as const
  if (source.includes("city") || source.includes("ville")) return "city" as const
  if (source.includes("gender") || source.includes("sexe")) return "gender" as const
  if (source.includes("occupation") || source.includes("profession")) return "occupation" as const
  if (source.includes("employer") || source.includes("workplace")) return "employer" as const
  return null
}

function buildParticipantPersonaFromPayload(
  roleKey: string,
  fields: TemplateFieldWithMeta[],
  payload: Record<string, unknown>,
) {
  const persona: ParticipantPersonaInput = {}

  for (const field of fields) {
    const roleMatch =
      field.participantRoleKey === roleKey ||
      (field.dataSource ? field.dataSource.includes(`personas.${roleKey}.`) : false) ||
      field.fieldName.startsWith(`${roleKey}.`)
    if (!roleMatch) continue

    const value = normalizeString(payload[field.fieldName])
    if (!value) continue

    const personaKey = inferPersonaKey(field.fieldName, field.dataSource)
    if (!personaKey) continue
    ;(persona as Record<string, string>)[personaKey] = value
  }

  return persona
}

function mergePersonaInput(
  explicitPersona: ParticipantPersonaInput | undefined,
  inferredPersona: ParticipantPersonaInput,
) {
  const merged: ParticipantPersonaInput = { ...inferredPersona, ...explicitPersona }

  for (const [key, value] of Object.entries(merged)) {
    const normalized = normalizeString(value)
    if (!normalized) {
      delete (merged as Record<string, unknown>)[key]
      continue
    }
    ;(merged as Record<string, string>)[key] = normalized
  }

  return merged
}

function hasPersonaCoreData(persona: ParticipantPersonaInput) {
  return Boolean(
    persona.fullName ||
      persona.fullNameAr ||
      persona.nationalId ||
      persona.phone ||
      persona.email ||
      persona.birthDate ||
      persona.birthPlace ||
      persona.addressLine1 ||
      persona.city ||
      persona.gender ||
      persona.occupation ||
      persona.employer,
  )
}

function buildPersonaUpdateData(persona: ParticipantPersonaInput) {
  return {
    fullName: persona.fullName ?? undefined,
    fullNameAr: persona.fullNameAr ?? undefined,
    phone: persona.phone ?? undefined,
    email: persona.email ?? undefined,
    birthDate: persona.birthDate ? new Date(persona.birthDate) : undefined,
    birthPlace: persona.birthPlace ?? undefined,
    addressLine1: persona.addressLine1 ?? undefined,
    city: persona.city ?? undefined,
    gender: persona.gender ?? undefined,
    occupation: persona.occupation ?? undefined,
    employer: persona.employer ?? undefined,
    locale: persona.locale ?? undefined,
    notes: persona.notes ?? undefined,
  }
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser(request.headers)
  if ("error" in authResult) {
    return authResult.error
  }
  const { currentUser } = authResult
  if (!hasAnyRole(currentUser, ["employee", "admin"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  let parsedBody: z.infer<typeof requestSchema>
  try {
    const json = await request.json()
    const result = requestSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid request payload",
          code: "INVALID_REQUEST_PAYLOAD",
          issues: result.error.flatten(),
        },
        { status: 400 },
      )
    }
    parsedBody = result.data
  } catch (error) {
    logApiError(
      { route: "/api/documents/generate", operation: "parse_request" },
      error,
    )
    return NextResponse.json(
      { message: "Unable to parse request body", code: "INVALID_JSON_PAYLOAD" },
      { status: 400 },
    )
  }

  const { templateId, slug, locale, payload, sourceDocumentId } = parsedBody
  const participants = parsedBody.participants ?? []
  const languageOverrideConfirmed = parsedBody.languageOverrideConfirmed === true
  const copies = parsedBody.copies ?? 1
  const amountPaid = parsedBody.amountPaid

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    include: {
      documentType: true,
      category: true,
      asset: true,
      fields: {
        select: {
          id: true,
          fieldName: true,
          fieldLabel: true,
          fieldLabelAr: true,
          isRequired: true,
          allowMultiple: true,
          dataSource: true,
          participantRoleKey: true,
        },
        orderBy: {
          displayOrder: "asc",
        },
      },
      participantRoles: {
        select: {
          roleKey: true,
          isRequired: true,
          minParticipants: true,
          maxParticipants: true,
        },
      },
    },
  })

  if (!template || template.slug !== slug) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 })
  }

  if (!template.isActive) {
    return NextResponse.json(
      { message: "Template is inactive", code: "TEMPLATE_INACTIVE" },
      { status: 409 },
    )
  }

  if (!template.content?.trim()) {
    return NextResponse.json(
      { message: "HTML template is required to generate PDF.", code: "TEMPLATE_CONTENT_MISSING" },
      { status: 422 },
    )
  }

  const preparedParticipants = participants.map((participant) => ({
    ...participant,
    persona: mergePersonaInput(
      participant.persona,
      buildParticipantPersonaFromPayload(participant.roleKey, template.fields, payload),
    ),
  }))

  const participantPersonaIds = Array.from(
    new Set(
      preparedParticipants
        .map((participant) => participant.personaId?.trim())
        .filter((personaId): personaId is string => Boolean(personaId)),
    ),
  )
  const storedParticipantPersonas = participantPersonaIds.length
    ? await prisma.persona.findMany({
        where: { id: { in: participantPersonaIds }, deletedAt: null },
        select: {
          id: true,
          fullName: true,
          fullNameAr: true,
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
    : []
  const storedPersonasById = new Map(
    storedParticipantPersonas.map((persona) => [persona.id, persona]),
  )
  const policyParticipants = preparedParticipants.map((participant) => {
    const stored = participant.personaId
      ? storedPersonasById.get(participant.personaId)
      : undefined
    if (!stored) return participant
    return {
      ...participant,
      persona: {
        ...participant.persona,
        fullName: stored.fullName ?? participant.persona.fullName,
        fullNameAr: stored.fullNameAr ?? participant.persona.fullNameAr,
        nationalId: stored.nationalId ?? participant.persona.nationalId,
        phone: stored.phone ?? participant.persona.phone,
        email: stored.email ?? participant.persona.email,
        birthDate: stored.birthDate?.toISOString() ?? participant.persona.birthDate,
        birthPlace: stored.birthPlace ?? participant.persona.birthPlace,
        addressLine1: stored.addressLine1 ?? participant.persona.addressLine1,
        city: stored.city ?? participant.persona.city,
        gender: stored.gender ?? participant.persona.gender,
        occupation: stored.occupation ?? participant.persona.occupation,
        employer: stored.employer ?? participant.persona.employer,
      },
    }
  })
  const participantIssues = validateParticipantSubmission(
    template.participantRoles,
    policyParticipants,
  )
  const templateRoleConfigInvalid = participantIssues.some(
    (issue) => issue.code === "PARTICIPANT_ROLE_CONFIG_INVALID",
  )
  if (templateRoleConfigInvalid) {
    return internalServerError(
      { route: "/api/documents/generate", operation: "validate_participant_role_config" },
      new Error("Template participant role configuration is invalid"),
    )
  }
  if (participantIssues.length) {
    return NextResponse.json(
      {
        message: "Participant requirements are not satisfied",
        code: "INVALID_PARTICIPANTS",
        issues: participantIssues,
      },
      { status: 400 },
    )
  }

  const effectiveParticipants = preparedParticipants.filter(hasParticipantIdentity)
  const fieldLabels = Object.fromEntries(
    template.fields.map((field) => [field.fieldName, field.fieldLabelAr || field.fieldLabel]),
  )
  const languageValidation = validateDocumentLanguage({
    locale: template.locale || locale,
    payload,
    fieldLabels,
    participants: effectiveParticipants.map((participant) => ({
      roleKey: participant.roleKey,
      persona: participant.persona,
    })),
  })

  const languageIssues = [
    ...languageValidation.hardIssues,
    ...languageValidation.overrideIssues,
  ]

  if (languageIssues.length && !languageOverrideConfirmed) {
    return NextResponse.json(
      {
        message: "Mixed-script fields require confirmation",
        code: "LANGUAGE_OVERRIDE_REQUIRED",
        issues: languageIssues,
      },
      { status: 409 },
    )
  }

  let normalizedValues: NormalizedFieldValue[]
  try {
    normalizedValues = normalizeTemplateValues(template.fields, payload)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Field validation error",
        code: "FIELD_VALIDATION_ERROR",
      },
      { status: 400 },
    )
  }

  const [readyStatus, pdfFormat, createDocumentActivity] = await Promise.all([
    prisma.documentStatus.findFirst({ where: { name: "READY" } }),
    prisma.fileFormat.findFirst({ where: { name: "PDF" } }),
    prisma.activityType.findFirst({ where: { name: "CREATE_DOCUMENT" } }),
  ])

  if (!readyStatus || !pdfFormat || !createDocumentActivity) {
    return internalServerError(
      { route: "/api/documents/generate", operation: "load_document_defaults" },
      new Error("Document defaults unavailable"),
    )
  }

  const metadata = (template.metadata ?? {}) as Record<string, unknown>
  const basePrice = typeof metadata.basePrice === "number" ? metadata.basePrice : null
  if (amountPaid !== undefined && !paymentUpdateSchema.safeParse({ amountPaid }).success) {
    return NextResponse.json(
      { message: "Invalid initial payment amount", code: "INVALID_PAYMENT" },
      { status: 400 },
    )
  }
  if (amountPaid !== undefined && amountPaid > 0 && basePrice === null) {
    return NextResponse.json(
      { message: "A template price is required before recording payment", code: "PRICE_REQUIRED" },
      { status: 400 },
    )
  }

  const paymentCalculation = basePrice === null
    ? null
    : calculatePaymentState(
        {
          totalCopies: copies,
          standardPrice: basePrice,
          negotiatedPrice: null,
          unitPrice: basePrice,
          discount: null,
          surcharge: null,
          amountPaid: null,
          paidAt: null,
          currency: "MAD",
        },
        { amountPaid: amountPaid ?? 0 },
      )
  if (paymentCalculation && !paymentCalculation.success) {
    return NextResponse.json(
      { message: paymentCalculation.message, code: paymentCalculation.code },
      { status: 400 },
    )
  }

  let fileName: string
  let filePath: string
  let outputPath = ""
  try {
    const payloadNested = buildNestedPayload(payload)
    const html = renderHtmlTemplate(template.content, payloadNested)
    const contentCss = typeof metadata.htmlCss === "string" ? metadata.htmlCss : null
    const pdfOptions = metadata.pdfOptions as Record<string, unknown> | undefined
    const pdfConfig = pdfOptions && typeof pdfOptions === "object"
      ? {
          format: typeof pdfOptions.format === "string" ? pdfOptions.format : undefined,
          margin: typeof pdfOptions.margin === "object" && pdfOptions.margin
            ? {
                top: typeof (pdfOptions.margin as any).top === "string" ? (pdfOptions.margin as any).top : undefined,
                right: typeof (pdfOptions.margin as any).right === "string" ? (pdfOptions.margin as any).right : undefined,
                bottom: typeof (pdfOptions.margin as any).bottom === "string" ? (pdfOptions.margin as any).bottom : undefined,
                left: typeof (pdfOptions.margin as any).left === "string" ? (pdfOptions.margin as any).left : undefined,
              }
            : undefined,
        }
      : undefined
    fileName = `${template.slug}-${randomUUID()}.pdf`
    filePath = buildDocumentStoragePath(fileName)
    const buffer = await generatePdfBufferFromHtml(html, pdfConfig, contentCss)
    outputPath = await writeDocumentFileAtomically(filePath, buffer)
  } catch (error) {
    if (outputPath) {
      await fs.unlink(outputPath).catch(() => undefined)
    }
    return internalServerError(
      { route: "/api/documents/generate", operation: "generate_pdf" },
      error,
      "PDF generation failed",
    )
  }

  let document
  let persistedParticipants: Array<{
    roleKey: string
    roleLabel: string | null
    personaId: string
    action: "linked_existing" | "updated_existing" | "created_new"
  }> = []
  try {
    document = await prisma.$transaction(async (tx) => {
      const payment = paymentCalculation?.success ? paymentCalculation.value : null

      const created = await tx.document.create({
        data: {
          templateId: template.id,
          createdById: currentUser.id,
          statusId: readyStatus.id,
          fileFormatId: pdfFormat.id,
          fileName,
          filePath,
          totalCopies: copies,
          notes: sourceDocumentId
            ? `version_from:${sourceDocumentId}`
            : null,
          standardPrice: payment?.standardPrice ?? null,
          unitPrice: payment?.unitPrice ?? null,
          discount: payment?.discount ?? null,
          surcharge: payment?.surcharge ?? null,
          chargedTotal: payment?.chargedTotal ?? null,
          amountPaid: payment?.amountPaid ?? amountPaid ?? null,
          changeGiven: payment?.changeGiven ?? null,
          paymentStatus: payment?.paymentStatus,
          paidAt: payment?.paidAt ?? null,
          cashierId: amountPaid !== undefined && amountPaid > 0 ? currentUser.id : null,
        },
        include: {
          status: true,
        },
      })

      if (normalizedValues.length) {
        await tx.documentFieldValue.createMany({
          data: normalizedValues.map((value) => ({
            documentId: created.id,
            fieldId: value.fieldId,
            value: value.value,
            ...(value.valueJson !== null && value.valueJson !== undefined
              ? { valueJson: value.valueJson }
              : {}),
          })),
        })
      }

      if (effectiveParticipants.length) {
        const participantRows: {
          documentId: string
          personaId: string
          roleKey: string
          roleLabel?: string | null
        }[] = []
        const participantResultRows: Array<{
          roleKey: string
          roleLabel: string | null
          personaId: string
          action: "linked_existing" | "updated_existing" | "created_new"
        }> = []

        for (const participant of effectiveParticipants) {
          const roleDefinition = template.participantRoles.find(
            (role) => role.roleKey === participant.roleKey,
          )
          const inferredPersona = buildParticipantPersonaFromPayload(
            participant.roleKey,
            template.fields,
            payload,
          )

          if (participant.personaId) {
            const existingPersona = await tx.persona.findUnique({
              where: { id: participant.personaId },
            })

            if (!existingPersona) {
              throw new Error(`Persona not found: ${participant.personaId}`)
            }

            const mergedPersonaForLinked = mergePersonaInput(participant.persona, inferredPersona)
            const hasLinkedPersonaData = hasPersonaCoreData(mergedPersonaForLinked)
            if (hasLinkedPersonaData) {
              await tx.persona.update({
                where: { id: existingPersona.id },
                data: buildPersonaUpdateData(mergedPersonaForLinked),
              })
            }

            participantRows.push({
              documentId: created.id,
              personaId: existingPersona.id,
              roleKey: participant.roleKey,
              roleLabel: participant.roleLabel ?? null,
            })
            participantResultRows.push({
              roleKey: participant.roleKey,
              roleLabel: participant.roleLabel ?? null,
              personaId: existingPersona.id,
              action: hasLinkedPersonaData ? "updated_existing" : "linked_existing",
            })
            continue
          }

          if (!participant.persona) {
            throw new Error(`Participant persona data is required for role ${participant.roleKey}`)
          }

          const personaData = mergePersonaInput(participant.persona, inferredPersona)
          const hasCoreData = hasPersonaCoreData(personaData)
          if (!hasCoreData) {
            if (roleDefinition?.isRequired ?? true) {
              throw new Error(`Participant identity is required for role ${participant.roleKey}`)
            }
            continue
          }
          let personaId: string

          if (personaData.nationalId) {
            const existingByNationalId = await tx.persona.findUnique({
              where: { nationalId: personaData.nationalId },
              select: { id: true },
            })
            const persona = await tx.persona.upsert({
              where: { nationalId: personaData.nationalId },
              update: buildPersonaUpdateData(personaData),
              create: {
                nationalId: personaData.nationalId,
                fullName: personaData.fullName ?? null,
                fullNameAr: personaData.fullNameAr ?? null,
                phone: personaData.phone ?? null,
                email: personaData.email ?? null,
                birthDate: personaData.birthDate ? new Date(personaData.birthDate) : null,
                birthPlace: personaData.birthPlace ?? null,
                addressLine1: personaData.addressLine1 ?? null,
                city: personaData.city ?? null,
                gender: personaData.gender ?? null,
                occupation: personaData.occupation ?? null,
                employer: personaData.employer ?? null,
                locale: personaData.locale ?? null,
                notes: personaData.notes ?? null,
                createdById: currentUser.id,
              },
            })
            personaId = persona.id
            participantResultRows.push({
              roleKey: participant.roleKey,
              roleLabel: participant.roleLabel ?? null,
              personaId,
              action: existingByNationalId ? "updated_existing" : "created_new",
            })
          } else {
            const persona = await tx.persona.create({
              data: {
                fullName: personaData.fullName ?? null,
                fullNameAr: personaData.fullNameAr ?? null,
                phone: personaData.phone ?? null,
                email: personaData.email ?? null,
                birthDate: personaData.birthDate ? new Date(personaData.birthDate) : null,
                birthPlace: personaData.birthPlace ?? null,
                addressLine1: personaData.addressLine1 ?? null,
                city: personaData.city ?? null,
                gender: personaData.gender ?? null,
                occupation: personaData.occupation ?? null,
                employer: personaData.employer ?? null,
                locale: personaData.locale ?? null,
                notes: personaData.notes ?? null,
                createdById: currentUser.id,
              },
            })
            personaId = persona.id
            participantResultRows.push({
              roleKey: participant.roleKey,
              roleLabel: participant.roleLabel ?? null,
              personaId,
              action: "created_new",
            })
          }

          participantRows.push({
            documentId: created.id,
            personaId,
            roleKey: participant.roleKey,
            roleLabel: participant.roleLabel ?? null,
          })
        }

        if (participantRows.length) {
          await tx.documentParticipant.createMany({
            data: participantRows,
            skipDuplicates: true,
          })
        }
        persistedParticipants = participantResultRows
      }

      await tx.activityLog.create({
        data: {
          userId: currentUser.id,
          activityTypeId: createDocumentActivity.id,
          resourceType: "Document",
          resourceId: created.id,
        },
      })

      await incrementDailyStats(tx, new Date(), {
        documentsCreated: 1,
        topDocumentType: template.documentType.name,
        topCategory: template.category.name,
      })

      return created
    })
  } catch (error) {
    try {
      await fs.unlink(outputPath)
    } catch (cleanupError) {
      logApiError(
        { route: "/api/documents/generate", operation: "cleanup_pdf_after_transaction_failure" },
        cleanupError,
      )
    }
    const message = error instanceof Error ? error.message : "Document creation failed"
    const isClientError =
      message.startsWith("Persona not found") ||
      message.startsWith("Participant persona data is required") ||
      message.startsWith("Participant identity is required")
    if (isClientError) {
      return NextResponse.json(
        { message: "Invalid participant data", code: "INVALID_PARTICIPANT" },
        { status: 400 },
      )
    }
    return internalServerError(
      { route: "/api/documents/generate", operation: "create_document" },
      error,
      "Document creation failed",
    )
  }

  if (!document) {
    return internalServerError(
      { route: "/api/documents/generate", operation: "verify_created_document" },
      new Error("Document transaction returned no record"),
      "Document creation failed",
    )
  }

  return NextResponse.json({
    message: "Document generated.",
    sourceDocumentId: sourceDocumentId ?? null,
    document: {
      id: document.id,
      templateId: template.id,
      statusId: document.statusId,
      status: document.status.name,
      createdAt: document.createdAt.toISOString(),
      locale,
      fileName,
      filePath,
    },
    savedFields: normalizedValues.map((value) => ({
      fieldName: value.fieldName,
      value: value.value,
    })),
    participants: effectiveParticipants.map((participant) => ({
      roleKey: participant.roleKey,
      roleLabel: participant.roleLabel ?? null,
    })),
    persistedParticipants,
  })
}
