"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"

import { useLocale } from "@/hooks/use-locale"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export type GenerationTemplateField = {
  id: string
  name: string
  label: string
  labelAr?: string | null
  type: string
  isRequired: boolean
  allowMultiple: boolean
  section?: string | null
  options?: string[] | null
  helpText?: string | null
  helpTextAr?: string | null
  dataSource?: string | null
  participantRoleKey?: string | null
}

export type GenerationTemplate = {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  locale: string
  basePrice?: number | null
  fields: GenerationTemplateField[]
  participantRoles?: {
    roleKey: string
    roleLabel: string
    roleLabelAr?: string | null
    isRequired?: boolean
  }[]
}

type TemplateFormProps = {
  template: GenerationTemplate
  initialValues?: Record<string, string>
  initialParticipants?: Record<
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
  initialParticipantIds?: Record<string, string>
  initialPayment?: { copies?: number; amountPaid?: number }
  initialDocumentId?: string
  entryMode?: "existing" | "new"
}

function buildSchema(template: GenerationTemplate) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of template.fields) {
    const key = toFormKey(field.name)
    if (field.isRequired) {
      shape[key] = z
        .string()
        .trim()
        .min(1, { message: `${field.labelAr || field.label} - ${field.type} is required` })
    } else {
      shape[key] = z.string().optional().or(z.literal(""))
    }
  }

  return z.object(shape)
}

type FormValues<T extends GenerationTemplate> = z.infer<ReturnType<typeof buildSchema>>

function toFormKey(name: string) {
  return name.replace(/\./g, "__")
}

function mapFieldTypeToInputType(field: GenerationTemplateField) {
  switch (field.type.toUpperCase()) {
    case "NUMBER":
      return "number"
    case "DATE":
      return "date"
    case "EMAIL":
      return "email"
    case "PHONE":
      return "tel"
    default:
      return "text"
  }
}

function normalizeOptions(options?: string[] | null) {
  if (!options) return []
  return options.map((option) => option.toString())
}

function isLtrField(field: GenerationTemplateField) {
  const key = field.name.toLowerCase()
  return (
    key.includes("registrationnumber") ||
    key.includes("frame") ||
    key.includes("vin") ||
    key.includes("plate") ||
    key.includes("vehicle.") ||
    field.type.toUpperCase() === "EMAIL" ||
    field.type.toUpperCase() === "PHONE"
  )
}

type LanguageGuardIssue = {
  key: string
  label: string
  valuePreview: string
  expectedScript: "arabic" | "latin"
  detectedScript: "arabic" | "latin" | "mixed"
  category: "LEGAL_OVERRIDE_REQUIRED" | "NON_LEGAL_MISMATCH"
}

type ParticipantPersonaDraft = {
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

type ParticipantSubmissionEntry = {
  roleKey: string
  roleLabel?: string
  personaId?: string
  persona: ParticipantPersonaDraft
}

function parseDateValue(value?: string) {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

type DatePickerFieldProps = {
  value?: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  dir?: "rtl" | "ltr"
}

function DatePickerField({ value, onChange, placeholder, disabled, dir = "rtl" }: DatePickerFieldProps) {
  const selectedDate = parseDateValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          {selectedDate ? format(selectedDate, "yyyy-MM-dd") : placeholder}
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir={dir}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear() + 2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function TemplateForm({
  template,
  initialValues,
  initialParticipants,
  initialParticipantIds,
  initialPayment,
  initialDocumentId,
  entryMode,
}: TemplateFormProps) {
  const { t, dir } = useLocale()
  const { toast } = useToast()

  const schema = useMemo(() => buildSchema(template), [template])
  const defaultValues = useMemo(() => {
    const entries = template.fields.map((field) => [toFormKey(field.name), ""])
    const defaults = Object.fromEntries(entries) as Record<string, string>
    if (initialValues) {
      for (const [fieldName, value] of Object.entries(initialValues)) {
        const key = toFormKey(fieldName)
        if (key in defaults) {
          defaults[key] = value ?? ""
        }
      }
    }
    return defaults as FormValues<typeof template>
  }, [template, initialValues])

  const form = useForm<FormValues<typeof template>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [languageOverrideOpen, setLanguageOverrideOpen] = useState(false)
  const [languageOverrideIssues, setLanguageOverrideIssues] = useState<LanguageGuardIssue[]>([])
  const [pendingValuesForOverride, setPendingValuesForOverride] = useState<FormValues<typeof template> | null>(null)
  const [pendingParticipantsForOverride, setPendingParticipantsForOverride] = useState<
    ParticipantSubmissionEntry[] | null
  >(null)
  const [participantChoiceOpen, setParticipantChoiceOpen] = useState(false)
  const [pendingValuesForParticipantChoice, setPendingValuesForParticipantChoice] = useState<FormValues<typeof template> | null>(null)
  const [participantChoices, setParticipantChoices] = useState<
    Array<
      ParticipantSubmissionEntry & {
        persist: boolean
        roleLabelAr?: string | null
        isRequired?: boolean
      }
    >
  >([])
  const [submittedPayload, setSubmittedPayload] = useState<Record<string, unknown> | null>(null)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(initialDocumentId ?? null)
  const documentId = useMemo(() => {
    if (activeDocumentId) {
      return activeDocumentId
    }
    if (
      submittedPayload &&
      "document" in submittedPayload &&
      submittedPayload.document &&
      typeof submittedPayload.document === "object" &&
      "id" in submittedPayload.document
    ) {
      return (submittedPayload.document as { id: string }).id
    }
    return null
  }, [submittedPayload, activeDocumentId])
  const [participants, setParticipants] = useState<
    Record<
      string,
      {
        personaId?: string
        fullName: string
        nationalId: string
        phone: string
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
  >(() => {
    const participantRoles = template.participantRoles ?? []
    const primaryRoleKey =
      participantRoles.find((role) => role.roleKey === "client")?.roleKey ??
      participantRoles[0]?.roleKey
    const fallbackParticipant =
      initialParticipants?.client ?? Object.values(initialParticipants ?? {})[0]
    const fallbackParticipantId =
      initialParticipantIds?.client ?? Object.values(initialParticipantIds ?? {})[0]

    return Object.fromEntries(
      participantRoles.map((role) => {
        const seededParticipant =
          initialParticipants?.[role.roleKey] ??
          (entryMode === "existing" && role.roleKey === primaryRoleKey
            ? fallbackParticipant
            : undefined)
        const seededParticipantId =
          initialParticipantIds?.[role.roleKey] ??
          (entryMode === "existing" && role.roleKey === primaryRoleKey
            ? fallbackParticipantId
            : undefined)

        return [
          role.roleKey,
          {
            personaId: seededParticipantId,
            fullName: seededParticipant?.fullName ?? "",
            nationalId: seededParticipant?.nationalId ?? "",
            phone: seededParticipant?.phone ?? "",
            email: seededParticipant?.email ?? "",
            birthDate: seededParticipant?.birthDate ?? "",
            birthPlace: seededParticipant?.birthPlace ?? "",
            addressLine1: seededParticipant?.addressLine1 ?? "",
            city: seededParticipant?.city ?? "",
            gender: seededParticipant?.gender ?? "",
            occupation: seededParticipant?.occupation ?? "",
            employer: seededParticipant?.employer ?? "",
          },
        ]
      }),
    )
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  useEffect(() => {
    const participantRoles = template.participantRoles ?? []
    const primaryRoleKey =
      participantRoles.find((role) => role.roleKey === "client")?.roleKey ??
      participantRoles[0]?.roleKey
    const fallbackParticipant =
      initialParticipants?.client ?? Object.values(initialParticipants ?? {})[0]
    const fallbackParticipantId =
      initialParticipantIds?.client ?? Object.values(initialParticipantIds ?? {})[0]

    setParticipants(
      Object.fromEntries(
        participantRoles.map((role) => {
          const seededParticipant =
            initialParticipants?.[role.roleKey] ??
            (entryMode === "existing" && role.roleKey === primaryRoleKey
              ? fallbackParticipant
              : undefined)
          const seededParticipantId =
            initialParticipantIds?.[role.roleKey] ??
            (entryMode === "existing" && role.roleKey === primaryRoleKey
              ? fallbackParticipantId
              : undefined)

          return [
            role.roleKey,
            {
              personaId: seededParticipantId,
              fullName: seededParticipant?.fullName ?? "",
              nationalId: seededParticipant?.nationalId ?? "",
              phone: seededParticipant?.phone ?? "",
              email: seededParticipant?.email ?? "",
              birthDate: seededParticipant?.birthDate ?? "",
              birthPlace: seededParticipant?.birthPlace ?? "",
              addressLine1: seededParticipant?.addressLine1 ?? "",
              city: seededParticipant?.city ?? "",
              gender: seededParticipant?.gender ?? "",
              occupation: seededParticipant?.occupation ?? "",
              employer: seededParticipant?.employer ?? "",
            },
          ]
        }),
      ),
    )
  }, [template.participantRoles, initialParticipants, initialParticipantIds, entryMode])

  const patchParticipant = (
    roleKey: string,
    patch: Partial<{
      fullName: string
      nationalId: string
      phone: string
      email: string
      birthDate: string
      birthPlace: string
      addressLine1: string
      city: string
      gender: string
      occupation: string
      employer: string
    }>,
  ) => {
    setParticipants((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        ...patch,
      },
    }))
  }

  const applyPersonaToFields = (roleKey: string, persona: Record<string, unknown>) => {
    const mappings: Record<string, string[]> = {
      fullName: ["fullName", "fullNameAr"],
      nationalId: ["nationalId"],
      phone: ["phone"],
      email: ["email"],
      birthDate: ["birthDate"],
      birthPlace: ["birthPlace"],
      addressLine1: ["addressLine1"],
      city: ["city"],
      gender: ["gender"],
      occupation: ["occupation"],
      employer: ["employer"],
    }

    template.fields.forEach((field) => {
      const dataSource = field.dataSource ?? ""
      const roleMatch =
        field.participantRoleKey === roleKey ||
        dataSource.includes(`personas.${roleKey}.`) ||
        field.name.startsWith(`${roleKey}.`)

      if (!roleMatch) return

      for (const [personaKey, aliases] of Object.entries(mappings)) {
        const matchesDataSource = aliases.some((alias) => dataSource.endsWith(`.${alias}`))
        const matchesFieldName = aliases.some((alias) => field.name.endsWith(`.${alias}`))
        if (!matchesDataSource && !matchesFieldName) continue

        const value = persona[personaKey]
        if (value === undefined || value === null || value === "") {
          return
        }
        const stringValue =
          value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
        form.setValue(toFormKey(field.name) as keyof FormValues<typeof template>, stringValue, {
          shouldDirty: true,
        })
        return
      }
    })
  }

  const [copies, setCopies] = useState(
    initialPayment?.copies ? String(initialPayment.copies) : "1",
  )
  const [amountPaid, setAmountPaid] = useState(
    initialPayment?.amountPaid !== undefined && initialPayment?.amountPaid !== null
      ? String(initialPayment.amountPaid)
      : "",
  )
  const basePrice = template.basePrice ?? 0
  const numericCopies = Math.max(1, Number(copies) || 1)
  const chargedTotal = basePrice ? basePrice * numericCopies : 0
  const amountPaidNumber = amountPaid ? Number(amountPaid) : 0
  const changeGiven = chargedTotal && amountPaidNumber
    ? Math.max(0, amountPaidNumber - chargedTotal)
    : 0
  const paymentStatus = chargedTotal
    ? amountPaidNumber >= chargedTotal
      ? "PAID"
      : amountPaidNumber > 0
        ? "PARTIAL"
        : "UNPAID"
    : "UNPAID"

  const sections = useMemo(() => {
    const sectionMap = new Map<string, GenerationTemplateField[]>()
    template.fields.forEach((field) => {
      const key = field.section || template.titleAr || template.title
      if (!sectionMap.has(key)) {
        sectionMap.set(key, [])
      }
      sectionMap.get(key)!.push(field)
    })
    return Array.from(sectionMap.entries())
  }, [template])

  const getLanguageIssueDescription = (issue: LanguageGuardIssue) => {
    const expectedLabel =
      issue.expectedScript === "arabic"
        ? t("templates.languageGuard.expectedArabic")
        : t("templates.languageGuard.expectedFrench")
    const categoryLabel =
      issue.category === "LEGAL_OVERRIDE_REQUIRED"
        ? t("templates.languageGuard.categoryLegal")
        : t("templates.languageGuard.categoryGeneral")

    return `${categoryLabel} • ${expectedLabel}`
  }

  const normalizeParticipantValue = (value?: string) => {
    if (!value) return undefined
    const normalized = value.trim()
    return normalized.length ? normalized : undefined
  }

  const inferPersonaKey = (fieldName: string, dataSource?: string | null) => {
    const source = `${fieldName}.${dataSource ?? ""}`.toLowerCase()
    if (source.includes("fullname")) return "fullName" as const
    if (source.includes("nationalid") || source.includes("cin")) return "nationalId" as const
    if (source.includes("phone") || source.includes("tel")) return "phone" as const
    if (source.includes("email") || source.includes("mail")) return "email" as const
    if (source.includes("birthdate")) return "birthDate" as const
    if (source.includes("birthplace")) return "birthPlace" as const
    if (source.includes("addressline1") || source.includes("address")) return "addressLine1" as const
    if (source.includes("city") || source.includes("ville")) return "city" as const
    if (source.includes("gender") || source.includes("sexe")) return "gender" as const
    if (source.includes("occupation") || source.includes("profession")) return "occupation" as const
    if (source.includes("employer")) return "employer" as const
    return null
  }

  const hasPersonaData = (persona: ParticipantPersonaDraft) =>
    Boolean(
      persona.fullName ||
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

  const getMissingParticipantFieldLabels = (
    participant: {
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
    } | undefined,
  ) => {
    const missing: string[] = []
    if (!participant?.fullName) missing.push(t("templates.participantFullName"))
    if (!participant?.nationalId) missing.push(t("templates.participantNationalId"))
    if (!participant?.phone) missing.push(t("templates.participantPhone"))
    if (!participant?.city) missing.push(t("templates.participantCity"))
    if (!participant?.addressLine1) missing.push(t("templates.participantAddress"))
    if (!participant?.email) missing.push(t("templates.participantEmail"))
    return missing
  }

  const buildParticipantSubmission = (values: FormValues<typeof template>) => {
    const payloadByField: Record<string, unknown> = {}
    template.fields.forEach((field) => {
      payloadByField[field.name] = values[toFormKey(field.name)]
    })

    return (template.participantRoles ?? []).map((role) => {
      const inferred: ParticipantPersonaDraft = {}
      for (const field of template.fields) {
        const dataSource = field.dataSource ?? null
        const roleMatch =
          field.participantRoleKey === role.roleKey ||
          (dataSource ? dataSource.includes(`personas.${role.roleKey}.`) : false) ||
          field.name.startsWith(`${role.roleKey}.`)
        if (!roleMatch) continue
        const personaKey = inferPersonaKey(field.name, dataSource)
        if (!personaKey) continue
        const value = normalizeParticipantValue(payloadByField[field.name]?.toString())
        if (!value) continue
        ;(inferred as Record<string, string>)[personaKey] = value
      }

      const explicit = participants[role.roleKey] ?? {}
      const mergedPersona: ParticipantPersonaDraft = {
        fullName: normalizeParticipantValue(explicit.fullName) ?? inferred.fullName,
        nationalId: normalizeParticipantValue(explicit.nationalId) ?? inferred.nationalId,
        phone: normalizeParticipantValue(explicit.phone) ?? inferred.phone,
        email: normalizeParticipantValue(explicit.email) ?? inferred.email,
        birthDate: normalizeParticipantValue(explicit.birthDate) ?? inferred.birthDate,
        birthPlace: normalizeParticipantValue(explicit.birthPlace) ?? inferred.birthPlace,
        addressLine1: normalizeParticipantValue(explicit.addressLine1) ?? inferred.addressLine1,
        city: normalizeParticipantValue(explicit.city) ?? inferred.city,
        gender: normalizeParticipantValue(explicit.gender) ?? inferred.gender,
        occupation: normalizeParticipantValue(explicit.occupation) ?? inferred.occupation,
        employer: normalizeParticipantValue(explicit.employer) ?? inferred.employer,
      }

      return {
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        roleLabelAr: role.roleLabelAr,
        isRequired: role.isRequired,
        personaId: explicit.personaId,
        persona: mergedPersona,
      }
    })
  }

  const submitDocument = async (
    values: FormValues<typeof template>,
    languageOverrideConfirmed: boolean,
    participantEntries?: ParticipantSubmissionEntry[],
  ) => {
    setIsSubmitting(true)
    try {
      if (entryMode === "existing") {
        const hasLinkedPersona = Object.values(participants).some(
          (participant) => Boolean(participant?.personaId),
        )
        if (!hasLinkedPersona) {
          throw new Error(
            t("documents.workflow.existingRequiresSelection", {
              defaultValue:
                "Sélectionnez d'abord un client existant depuis la recherche client avant de générer le document.",
            }),
          )
        }
      }

      const payload: Record<string, unknown> = {}
      template.fields.forEach((field) => {
        const rawValue = values[toFormKey(field.name)]
        if (field.allowMultiple) {
          const parts = (rawValue ?? "")
            .toString()
            .split(/\r?\n/)
            .map((part: string) => part.trim())
            .filter(Boolean)
          payload[field.name] = parts
        } else if (field.type.toUpperCase() === "NUMBER") {
          payload[field.name] = rawValue ? Number(rawValue) : null
        } else {
          payload[field.name] = rawValue ?? ""
        }
      })

      const endpoint = "/api/documents/generate"
      const method = "POST"
      const participantsPayload =
        participantEntries ??
        buildParticipantSubmission(values).map((role) => ({
          roleKey: role.roleKey,
          roleLabel: role.roleLabel,
          ...(role.personaId ? { personaId: role.personaId } : {}),
          persona: role.persona,
        }))
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          slug: template.slug,
          locale: template.locale,
          ...(initialDocumentId ? { sourceDocumentId: initialDocumentId } : {}),
          payload,
          copies: numericCopies,
          amountPaid: amountPaid ? Number(amountPaid) : undefined,
          languageOverrideConfirmed,
          participants: participantsPayload,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as Record<string, unknown>))
        const errorCode =
          typeof errorData.code === "string" ? errorData.code : undefined
        const issues = Array.isArray(errorData.issues)
          ? (errorData.issues as LanguageGuardIssue[])
          : []

        if (errorCode === "LANGUAGE_OVERRIDE_REQUIRED" || errorCode === "LANGUAGE_MISMATCH") {
          setLanguageOverrideIssues(issues)
          setPendingValuesForOverride(values)
          setPendingParticipantsForOverride(participantsPayload)
          setLanguageOverrideOpen(true)
          toast({
            title: t("templates.languageGuard.overrideRequiredToast"),
          })
          return
        }

        if (errorCode === "INVALID_REQUEST_PAYLOAD" || errorCode === "INVALID_JSON_PAYLOAD") {
          const issueDetails =
            errorData.issues && typeof errorData.issues === "object"
              ? JSON.stringify(errorData.issues)
              : ""
          throw new Error(
            issueDetails
              ? t("documents.workflow.requestInvalidWithDetails", {
                  defaultValue:
                    "Le formulaire contient des données invalides. Vérifiez les champs requis puis réessayez.",
                })
              : t("documents.workflow.requestInvalid", {
                  defaultValue:
                    "Le formulaire contient des données invalides. Vérifiez les champs requis puis réessayez.",
                }),
          )
        }

        throw new Error(
          typeof errorData.message === "string"
            ? errorData.message
            : t("documents.workflow.requestFailed", {
                defaultValue:
                  "La demande n'a pas pu être traitée. Réessayez dans quelques instants.",
              }),
        )
      }

      const data = await response.json()
      setSubmittedPayload(data)
      if (data?.document?.id) {
        setActiveDocumentId(data.document.id)
      }
      toast({
        title: initialDocumentId
          ? t("documents.actions.duplicateSuccess")
          : t("templates.generationSuccess"),
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t("templates.generationError"),
        description:
          error instanceof Error
            ? error.message
            : t("documents.workflow.unknownError", {
                defaultValue: "Une erreur inattendue est survenue. Veuillez réessayer.",
              }),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: FormValues<typeof template>) => {
    const detectedParticipants = buildParticipantSubmission(values).filter(
      (role) => role.personaId || hasPersonaData(role.persona),
    )

    if (!detectedParticipants.length) {
      await submitDocument(values, false)
      return
    }

    setParticipantChoices(
      detectedParticipants.map((role) => ({
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        roleLabelAr: role.roleLabelAr,
        personaId: role.personaId,
        persona: role.persona,
        persist: role.isRequired ? true : true,
        isRequired: role.isRequired,
      })),
    )
    setPendingValuesForParticipantChoice(values)
    setParticipantChoiceOpen(true)
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{template.titleAr || template.title}</CardTitle>
          <CardDescription>
            {t("templates.formInstructions")}
          </CardDescription>
          {entryMode ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {entryMode === "existing"
                ? t("documents.workflow.existingModeHint", {
                    defaultValue:
                      "Mode client existant: sélectionnez un client depuis la recherche pour réutiliser sa fiche.",
                  })
                : t("documents.workflow.newModeHint", {
                    defaultValue:
                      "Mode nouveau client: le client sera créé automatiquement lors de la génération du document.",
                  })}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("documents.detail.unitPrice")}</p>
              <Input
                value={basePrice ? basePrice.toString() : ""}
                placeholder={t("documents.detail.unitPrice")}
                disabled
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("documents.detail.copies")}</p>
              <Input
                type="number"
                min={1}
                value={copies}
                onChange={(event) => setCopies(event.target.value)}
                placeholder={t("documents.detail.copies")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("documents.detail.amountPaid")}</p>
              <Input
                type="number"
                inputMode="decimal"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder={t("documents.detail.amountPaid")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("documents.detail.amount")}</p>
              <Input
                value={chargedTotal ? chargedTotal.toFixed(2) : ""}
                placeholder={t("documents.detail.amount")}
                disabled
              />
            </div>
          </div>
          <div className="mb-4 rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{t("documents.detail.amountPaid")}</span>
              <span>{amountPaidNumber ? amountPaidNumber.toFixed(2) : "—"} MAD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("documents.detail.changeGiven")}</span>
              <span>{changeGiven ? changeGiven.toFixed(2) : "—"} MAD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("documents.detail.paymentStatus")}</span>
              <span>{paymentStatus}</span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {sections.map(([sectionName, fields]) => (
                <div key={sectionName} className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
                  <h2 className="text-base font-semibold tracking-tight">{sectionName}</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {fields.map((field) => {
                      const inputType = mapFieldTypeToInputType(field)
                      const options = normalizeOptions(field.options)
                      const helpText = field.helpTextAr || field.helpText

                      return (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={toFormKey(field.name) as keyof FormValues<typeof template>}
                          render={({ field: controlField }) => (
                            <FormItem>
                              <FormLabel>
                                {field.labelAr || field.label}
                                {field.isRequired ? <span className="text-destructive"> *</span> : null}
                              </FormLabel>
                              {field.type.toUpperCase() === "TEXTAREA" || field.allowMultiple ? (
                                <FormControl>
                                  <Textarea
                                    disabled={isSubmitting}
                                    placeholder={field.labelAr || field.label}
                                    style={isLtrField(field) ? { direction: "ltr", unicodeBidi: "isolate" } : undefined}
                                    {...controlField}
                                  />
                                </FormControl>
                              ) : field.type.toUpperCase() === "SELECT" && options.length ? (
                                <Select
                                  disabled={isSubmitting}
                                  onValueChange={controlField.onChange}
                                  value={controlField.value ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={field.labelAr || field.label} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.type.toUpperCase() === "DATE" ? (
                                <FormControl>
                                  <DatePickerField
                                    value={controlField.value}
                                    onChange={controlField.onChange}
                                    placeholder={field.labelAr || field.label}
                                    disabled={isSubmitting}
                                    dir={dir}
                                  />
                                </FormControl>
                              ) : (
                                <FormControl>
                                  <Input
                                    type={inputType}
                                    disabled={isSubmitting}
                                    placeholder={field.labelAr || field.label}
                                    style={isLtrField(field) ? { direction: "ltr", unicodeBidi: "isolate" } : undefined}
                                    {...controlField}
                                  />
                                </FormControl>
                              )}
                              {helpText ? <FormDescription>{helpText}</FormDescription> : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="min-w-40" disabled={isSubmitting}>
                  {isSubmitting ? t("templates.pendingGeneration") : t("templates.generateAction")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => form.reset(defaultValues)}
                >
                  {t("templates.resetAction")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {template.participantRoles?.length ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>{t("templates.participantsTitle")}</CardTitle>
            <CardDescription>{t("templates.participantsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="multiple" className="space-y-3">
              {template.participantRoles.map((role) => {
                const participant = participants[role.roleKey] ?? {}
                const summary = [participant.fullName, participant.nationalId, participant.phone]
                  .filter(Boolean)
                  .join(" • ")
                const missingFields = getMissingParticipantFieldLabels(participant)

                return (
                  <AccordionItem
                    key={role.roleKey}
                    value={role.roleKey}
                    className="rounded-xl border border-border/80 bg-card px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full flex-col gap-1 pe-3 text-start">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {role.roleLabelAr || role.roleLabel}
                          </span>
                          {role.isRequired ? (
                            <Badge variant="secondary">{t("common.required")}</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {summary || t("templates.participantLookupHint")}
                        </p>
                        {missingFields.length ? (
                          <p className="text-xs text-amber-600">
                            {t("templates.participantMissingPrefix", {
                              defaultValue: "Informations à compléter",
                            })}
                            : {missingFields.slice(0, 3).join(" • ")}
                            {missingFields.length > 3
                              ? ` +${missingFields.length - 3}`
                              : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-600">
                            {t("templates.participantComplete", {
                              defaultValue: "Fiche client complète",
                            })}
                          </p>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("templates.participantCoreInfo", { defaultValue: "Informations principales" })}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={async () => {
                              const nationalId = participants[role.roleKey]?.nationalId?.trim()
                              const phone = participants[role.roleKey]?.phone?.trim()
                              const fullName = participants[role.roleKey]?.fullName?.trim()
                              const query = nationalId || phone || fullName

                              if (!query) {
                                toast({
                                  title: t("templates.participantLookupError"),
                                  description: t("templates.participantLookupHint"),
                                  variant: "destructive",
                                })
                                return
                              }
                              try {
                                const response = await fetch(`/api/personas?q=${encodeURIComponent(query)}&limit=1`)
                                if (!response.ok) {
                                  throw new Error("Lookup failed")
                                }
                                const data = await response.json()
                                if (!Array.isArray(data) || !data.length) {
                                  toast({ title: t("templates.participantNotFound") })
                                  return
                                }
                                const persona = data[0]
                                setParticipants((prev) => ({
                                  ...prev,
                                  [role.roleKey]: {
                                    ...prev[role.roleKey],
                                    personaId: persona.id || prev[role.roleKey]?.personaId,
                                    fullName: persona.fullName || "",
                                    phone: persona.phone || "",
                                    nationalId: persona.nationalId || prev[role.roleKey]?.nationalId || "",
                                    email: persona.email || prev[role.roleKey]?.email,
                                    birthDate: persona.birthDate || prev[role.roleKey]?.birthDate,
                                    birthPlace: persona.birthPlace || prev[role.roleKey]?.birthPlace,
                                    addressLine1: persona.addressLine1 || prev[role.roleKey]?.addressLine1,
                                    city: persona.city || prev[role.roleKey]?.city,
                                    gender: persona.gender || prev[role.roleKey]?.gender,
                                    occupation: persona.occupation || prev[role.roleKey]?.occupation,
                                    employer: persona.employer || prev[role.roleKey]?.employer,
                                  },
                                }))
                                applyPersonaToFields(role.roleKey, persona)
                                toast({ title: t("templates.participantFound") })
                              } catch (error) {
                                toast({
                                  title: t("templates.participantLookupError"),
                                  description: error instanceof Error ? error.message : "Lookup failed",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            {t("templates.participantLookup")}
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("templates.participantFullName")}</p>
                            <Input
                              value={participant.fullName ?? ""}
                              onChange={(event) => patchParticipant(role.roleKey, { fullName: event.target.value })}
                              placeholder={t("templates.participantFullNamePlaceholder")}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("templates.participantNationalId")}</p>
                            <Input
                              value={participant.nationalId ?? ""}
                              onChange={(event) => patchParticipant(role.roleKey, { nationalId: event.target.value })}
                              placeholder={t("templates.participantNationalIdPlaceholder")}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("templates.participantPhone")}</p>
                            <Input
                              value={participant.phone ?? ""}
                              onChange={(event) => patchParticipant(role.roleKey, { phone: event.target.value })}
                              placeholder={t("templates.participantPhonePlaceholder")}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("templates.participantBirthDate")}</p>
                            <DatePickerField
                              value={participant.birthDate ?? ""}
                              onChange={(nextDate) => patchParticipant(role.roleKey, { birthDate: nextDate })}
                              placeholder={t("templates.participantBirthDatePlaceholder")}
                              disabled={isSubmitting}
                              dir={dir}
                            />
                          </div>
                        </div>
                        <div className="rounded-lg border border-dashed border-border/70 p-3">
                          <p className="mb-3 text-xs font-medium text-muted-foreground">
                            {t("templates.participantAdvancedInfo", { defaultValue: "Informations complémentaires" })}
                          </p>
                          <div className="grid gap-3 md:grid-cols-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantEmail")}</p>
                              <Input
                                value={participant.email ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { email: event.target.value })}
                                placeholder={t("templates.participantEmailPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantBirthPlace")}</p>
                              <Input
                                value={participant.birthPlace ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { birthPlace: event.target.value })}
                                placeholder={t("templates.participantBirthPlacePlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantCity")}</p>
                              <Input
                                value={participant.city ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { city: event.target.value })}
                                placeholder={t("templates.participantCityPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantGender")}</p>
                              <Input
                                value={participant.gender ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { gender: event.target.value })}
                                placeholder={t("templates.participantGenderPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantOccupation")}</p>
                              <Input
                                value={participant.occupation ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { occupation: event.target.value })}
                                placeholder={t("templates.participantOccupationPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantEmployer")}</p>
                              <Input
                                value={participant.employer ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { employer: event.target.value })}
                                placeholder={t("templates.participantEmployerPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{t("templates.participantAddress")}</p>
                              <Input
                                value={participant.addressLine1 ?? ""}
                                onChange={(event) => patchParticipant(role.roleKey, { addressLine1: event.target.value })}
                                placeholder={t("templates.participantAddressPlaceholder")}
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      ) : null}

      {submittedPayload ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>{t("templates.resultTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {documentId ? (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button asChild variant="outline">
                  <a href={`/api/documents/${documentId}/download`}>
                    {t("templates.downloadAction")}
                  </a>
                </Button>
              </div>
            ) : null}
            {submittedPayload &&
            "persistedParticipants" in submittedPayload &&
            Array.isArray((submittedPayload as { persistedParticipants?: unknown[] }).persistedParticipants) ? (
              <div className="mb-4 rounded-md border bg-muted/30 p-3 text-xs">
                <p className="mb-2 font-medium">
                  {t("documents.workflow.persistedParticipants", {
                    defaultValue: "Résultat persistance client",
                  })}
                </p>
                <ul className="list-disc space-y-1 ps-5">
                  {(submittedPayload as {
                    persistedParticipants: Array<{
                      roleKey: string
                      roleLabel: string | null
                      personaId: string
                      action: string
                    }>
                  }).persistedParticipants.map((item, index) => (
                    <li key={`${item.roleKey}-${item.personaId}-${index}`}>
                      {item.roleLabel || item.roleKey} → {item.personaId} (
                      {t(`documents.workflow.persistenceActions.${item.action}`, {
                        defaultValue: item.action,
                      })}
                      )
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {documentId ? (
              <div className="mb-4 rounded-md border">
                <iframe
                  title="generated-document-preview"
                  src={`/api/documents/${documentId}/preview`}
                  className="h-[680px] w-full"
                />
              </div>
            ) : null}
            <pre className="max-h-[380px] overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(submittedPayload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={participantChoiceOpen} onOpenChange={setParticipantChoiceOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("documents.workflow.participantChoiceTitle", {
                defaultValue: "Choisir les clients à enregistrer",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("documents.workflow.participantChoiceDescription", {
                defaultValue:
                  "Le système a détecté des clients dans ce document. Confirmez lesquels doivent être enregistrés dans la base.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[55vh] space-y-3 overflow-auto rounded-md border bg-muted/20 p-3">
            {participantChoices.map((choice) => (
              <div key={choice.roleKey} className="rounded-md border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {choice.roleLabelAr || choice.roleLabel || choice.roleKey}
                    {choice.isRequired ? <span className="text-destructive"> *</span> : null}
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={choice.persist}
                      onChange={(event) =>
                        setParticipantChoices((prev) =>
                          prev.map((item) =>
                            item.roleKey === choice.roleKey
                              ? { ...item, persist: event.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    {t("documents.workflow.participantPersistLabel", {
                      defaultValue: "Enregistrer ce client",
                    })}
                  </label>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("templates.participantFullName")}</p>
                    <Input
                      value={choice.persona.fullName ?? ""}
                      placeholder={t("templates.participantFullNamePlaceholder")}
                      onChange={(event) =>
                        setParticipantChoices((prev) =>
                          prev.map((item) =>
                            item.roleKey === choice.roleKey
                              ? { ...item, persona: { ...item.persona, fullName: event.target.value } }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("templates.participantNationalId")}</p>
                    <Input
                      value={choice.persona.nationalId ?? ""}
                      placeholder={t("templates.participantNationalIdPlaceholder")}
                      onChange={(event) =>
                        setParticipantChoices((prev) =>
                          prev.map((item) =>
                            item.roleKey === choice.roleKey
                              ? { ...item, persona: { ...item.persona, nationalId: event.target.value } }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("templates.participantPhone")}</p>
                    <Input
                      value={choice.persona.phone ?? ""}
                      placeholder={t("templates.participantPhonePlaceholder")}
                      onChange={(event) =>
                        setParticipantChoices((prev) =>
                          prev.map((item) =>
                            item.roleKey === choice.roleKey
                              ? { ...item, persona: { ...item.persona, phone: event.target.value } }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t("templates.participantCity")}</p>
                    <Input
                      value={choice.persona.city ?? ""}
                      placeholder={t("templates.participantCityPlaceholder")}
                      onChange={(event) =>
                        setParticipantChoices((prev) =>
                          prev.map((item) =>
                            item.roleKey === choice.roleKey
                              ? { ...item, persona: { ...item.persona, city: event.target.value } }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setParticipantChoiceOpen(false)
                setPendingValuesForParticipantChoice(null)
              }}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingValuesForParticipantChoice) return
                setParticipantChoiceOpen(false)
                const selectedParticipants = participantChoices
                  .filter((choice) => choice.persist)
                  .map((choice) => ({
                    roleKey: choice.roleKey,
                    roleLabel: choice.roleLabel,
                    ...(choice.personaId ? { personaId: choice.personaId } : {}),
                    persona: choice.persona,
                  }))
                await submitDocument(pendingValuesForParticipantChoice, false, selectedParticipants)
                setPendingValuesForParticipantChoice(null)
              }}
            >
              {t("documents.workflow.participantChoiceConfirm", {
                defaultValue: "Confirmer et générer",
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={languageOverrideOpen} onOpenChange={setLanguageOverrideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("templates.languageGuard.overrideTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("templates.languageGuard.overrideDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-2 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
            {languageOverrideIssues.map((issue, index) => (
              <div key={`${issue.key}-${index}`} className="rounded border bg-background p-2">
                <p className="font-medium">{issue.label}</p>
                <p className="text-muted-foreground">{getLanguageIssueDescription(issue)}</p>
                <p className="mt-1 truncate text-muted-foreground">
                  {t("templates.languageGuard.issueValue")}: {issue.valuePreview}
                </p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting || !pendingValuesForOverride}
              onClick={async () => {
                if (!pendingValuesForOverride) return
                setLanguageOverrideOpen(false)
                await submitDocument(
                  pendingValuesForOverride,
                  true,
                  pendingParticipantsForOverride ?? undefined,
                )
                setPendingValuesForOverride(null)
                setPendingParticipantsForOverride(null)
                setLanguageOverrideIssues([])
              }}
            >
              {t("templates.languageGuard.confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
