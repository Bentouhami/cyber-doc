"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

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
  initialPayment?: { copies?: number; amountPaid?: number }
  initialDocumentId?: string
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

export function TemplateForm({ template, initialValues, initialParticipants, initialPayment, initialDocumentId }: TemplateFormProps) {
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
  >(
    () =>
      Object.fromEntries(
        (template.participantRoles ?? []).map((role) => [
          role.roleKey,
          {
            fullName: initialParticipants?.[role.roleKey]?.fullName ?? "",
            nationalId: initialParticipants?.[role.roleKey]?.nationalId ?? "",
            phone: initialParticipants?.[role.roleKey]?.phone ?? "",
          },
        ]),
      ),
  )

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  useEffect(() => {
    setParticipants(
      Object.fromEntries(
        (template.participantRoles ?? []).map((role) => [
          role.roleKey,
          {
            fullName: initialParticipants?.[role.roleKey]?.fullName ?? "",
            nationalId: initialParticipants?.[role.roleKey]?.nationalId ?? "",
            phone: initialParticipants?.[role.roleKey]?.phone ?? "",
          },
        ]),
      ),
    )
  }, [template.participantRoles, initialParticipants])

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

  const onSubmit = async (values: FormValues<typeof template>) => {
    setIsSubmitting(true)
    try {
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

      const endpoint = initialDocumentId
        ? `/api/documents/${initialDocumentId}`
        : "/api/documents/generate"
      const method = initialDocumentId ? "PATCH" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          slug: template.slug,
          locale: template.locale,
          payload,
          copies: numericCopies,
          amountPaid: amountPaid ? Number(amountPaid) : undefined,
          participants: (template.participantRoles ?? []).map((role) => ({
            roleKey: role.roleKey,
            roleLabel: role.roleLabel,
            persona: {
              fullName: participants[role.roleKey]?.fullName || undefined,
              nationalId: participants[role.roleKey]?.nationalId || undefined,
              phone: participants[role.roleKey]?.phone || undefined,
              email: participants[role.roleKey]?.email || undefined,
              birthDate: participants[role.roleKey]?.birthDate || undefined,
              birthPlace: participants[role.roleKey]?.birthPlace || undefined,
              addressLine1: participants[role.roleKey]?.addressLine1 || undefined,
              city: participants[role.roleKey]?.city || undefined,
              gender: participants[role.roleKey]?.gender || undefined,
              occupation: participants[role.roleKey]?.occupation || undefined,
              employer: participants[role.roleKey]?.employer || undefined,
            },
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Request failed")
      }

      const data = await response.json()
      setSubmittedPayload(data)
      if (data?.documentId) {
        setActiveDocumentId(data.documentId)
      }
      toast({
        title: initialDocumentId ? t("templates.updateSuccess") : t("templates.generationSuccess"),
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t("templates.generationError"),
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <CardTitle>{template.titleAr || template.title}</CardTitle>
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
            <Input
              type="number"
              min={1}
              value={copies}
              onChange={(event) => setCopies(event.target.value)}
              placeholder={t("documents.detail.copies")}
              disabled={isSubmitting}
            />
            <Input
              type="number"
              inputMode="decimal"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              placeholder={t("documents.detail.amountPaid")}
              disabled={isSubmitting}
            />
            <Input
              value={chargedTotal ? chargedTotal.toFixed(2) : ""}
              placeholder={t("documents.detail.amount")}
              disabled
            />
          </div>
          <div className="mb-4 rounded-md border px-3 py-2 text-sm text-muted-foreground">
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
                <div key={sectionName} className="space-y-4 rounded-lg border p-4">
                  <h2 className="text-lg font-semibold">{sectionName}</h2>
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
                <Button type="submit" disabled={isSubmitting}>
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
        <Card>
          <CardHeader>
            <CardTitle>{t("templates.participantsTitle")}</CardTitle>
            <CardDescription>{t("templates.participantsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.participantRoles.map((role) => (
              <div key={role.roleKey} className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">
                  {role.roleLabelAr || role.roleLabel}
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <Input
                    value={participants[role.roleKey]?.fullName ?? ""}
                    onChange={(event) =>
                      setParticipants((prev) => ({
                        ...prev,
                        [role.roleKey]: {
                          ...prev[role.roleKey],
                          fullName: event.target.value,
                        },
                      }))
                    }
                    placeholder={t("templates.participantFullName")}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={participants[role.roleKey]?.nationalId ?? ""}
                    onChange={(event) =>
                      setParticipants((prev) => ({
                        ...prev,
                        [role.roleKey]: {
                          ...prev[role.roleKey],
                          nationalId: event.target.value,
                        },
                      }))
                    }
                    placeholder={t("templates.participantNationalId")}
                    disabled={isSubmitting}
                  />
                  <Input
                    value={participants[role.roleKey]?.phone ?? ""}
                    onChange={(event) =>
                      setParticipants((prev) => ({
                        ...prev,
                        [role.roleKey]: {
                          ...prev[role.roleKey],
                          phone: event.target.value,
                        },
                      }))
                    }
                    placeholder={t("templates.participantPhone")}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-3">
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
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {submittedPayload ? (
        <Card>
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
    </div>
  )
}
