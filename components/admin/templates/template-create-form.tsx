"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { useLocale } from "@/hooks/use-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type EditorMode = "simple" | "developer"
type SimpleBlockKind = "TEXT" | "DATE" | "PHONE" | "NUMBER" | "PARAGRAPH" | "SIGNATURE"

type TaxonomyCategory = {
  id: number
  name: string
  nameAr?: string | null
}

type TaxonomyType = {
  id: number
  name: string
  nameAr?: string | null
  categories: TaxonomyCategory[]
}

type DuplicateCandidate = {
  slug: string
  title: string
  updatedAt: string
  reasons?: string[]
}

type SimpleBlock = {
  id: string
  kind: SimpleBlockKind
  label: string
  labelAr: string
  fieldName: string
  isRequired: boolean
  paragraphText: string
}

const NEW_OPTION = "__new__"

const SIMPLE_DEFAULT_CSS = `body { font-family: "Tajawal", "Segoe UI", Arial, sans-serif; color: #111827; font-size: 14px; line-height: 1.7; }
.page { padding: 24px; }
.doc-header { margin-bottom: 18px; }
.doc-title { margin: 0 0 6px; font-size: 24px; font-weight: 700; }
.doc-subtitle { margin: 0; color: #4b5563; font-size: 13px; }
.doc-body p { margin: 0 0 10px; }
.doc-date { margin-top: 18px; font-size: 13px; }
.doc-signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 48px; }
.doc-signature-line { border-top: 1px solid #111827; padding-top: 6px; font-size: 13px; }`

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

function createNewBlock(
  kind: SimpleBlockKind = "TEXT",
  defaults?: { newFieldLabel: string; newParagraphText: string },
): SimpleBlock {
  return {
    id: crypto.randomUUID(),
    kind,
    label:
      kind === "PARAGRAPH" || kind === "SIGNATURE"
        ? ""
        : defaults?.newFieldLabel ?? "Nouveau champ",
    labelAr: "",
    fieldName: kind === "PARAGRAPH" || kind === "SIGNATURE" ? "" : `client.field_${Date.now()}`,
    isRequired: false,
    paragraphText:
      kind === "PARAGRAPH" ? defaults?.newParagraphText ?? "Nouveau paragraphe" : "",
  }
}

function buildSimpleTemplateHtml(payload: {
  title: string
  description: string
  blocks: SimpleBlock[]
  includeDateLine: boolean
  dateLabel: string
  signatureFallbackLabel: string
}) {
  const lines = payload.blocks
    .map((block) => {
      if (block.kind === "PARAGRAPH") {
        if (!block.paragraphText.trim()) return ""
        return `<p>${escapeHtml(block.paragraphText).replaceAll("\n", "<br/>")}</p>`
      }

      if (block.kind === "SIGNATURE") {
        const signatureLabel = block.label.trim() || payload.signatureFallbackLabel
        return `<div class=\"doc-signature-line\">${escapeHtml(signatureLabel)}</div>`
      }

      if (!block.fieldName.trim() || !block.label.trim()) {
        return ""
      }

      return `<p><strong>${escapeHtml(block.label)}:</strong> {{${block.fieldName.trim()}}}</p>`
    })
    .filter(Boolean)

  const safeDescription = payload.description.trim()
    ? `<p class=\"doc-subtitle\">${escapeHtml(payload.description.trim())}</p>`
    : ""

  const dateLine = payload.includeDateLine
    ? `<p class=\"doc-date\">${escapeHtml(payload.dateLabel)}: {{document.createdAt}}</p>`
    : ""

  const hasSignatures = payload.blocks.some((block) => block.kind === "SIGNATURE")
  const signatures = hasSignatures
    ? `<div class=\"doc-signatures\">${payload.blocks
        .filter((block) => block.kind === "SIGNATURE")
        .map(
          (block) =>
            `<div class=\"doc-signature-line\">${escapeHtml(
              block.label.trim() || payload.signatureFallbackLabel,
            )}</div>`,
        )
        .join("")}</div>`
    : ""

  return `<div class=\"page\">\n  <header class=\"doc-header\">\n    <h1 class=\"doc-title\">${escapeHtml(payload.title)}</h1>\n    ${safeDescription}\n  </header>\n  <main class=\"doc-body\">\n    ${lines.join("\n") || "<p>{{client.fullName}}</p>"}\n  </main>\n  ${dateLine}\n  ${signatures}\n</div>`
}

function mapSimpleBlocksToFields(blocks: SimpleBlock[]) {
  return blocks
    .filter((block) => !["PARAGRAPH", "SIGNATURE"].includes(block.kind))
    .filter((block) => block.fieldName.trim() && block.label.trim())
    .map((block, index) => ({
      fieldName: block.fieldName.trim(),
      fieldLabel: block.label.trim(),
      fieldLabelAr: block.labelAr.trim() || undefined,
      fieldType: block.kind,
      isRequired: block.isRequired,
      participantRoleKey: block.fieldName.startsWith("client.") ? "client" : undefined,
      displayOrder: index + 1,
      dataSource: block.fieldName.startsWith("client.") ? `personas.client.${block.fieldName.split(".").slice(1).join(".")}` : undefined,
      section: "Client",
      sectionAr: "الزبون",
    }))
}

export function TemplateCreateForm() {
  const { t, dir, language } = useLocale()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([])
  const [pendingCreatePayload, setPendingCreatePayload] = useState<Record<string, unknown> | null>(null)
  const [assets, setAssets] = useState<{ id: string; fileName: string; filePath: string }[]>([])
  const [taxonomy, setTaxonomy] = useState<TaxonomyType[]>([])
  const [mode, setMode] = useState<EditorMode>("simple")
  const [simplePreviewMode, setSimplePreviewMode] = useState<"rendered" | "code">("rendered")
  const tt = useCallback((key: string, fallback: string) => t(key, { defaultValue: fallback }), [t])
  const [simpleBlocks, setSimpleBlocks] = useState<SimpleBlock[]>(() => [
    {
      id: crypto.randomUUID(),
      kind: "TEXT",
      label: tt("templates.defaultFieldFullNameFr", "Nom complet"),
      labelAr: tt("templates.defaultFieldFullNameAr", "الاسم الكامل"),
      fieldName: "client.fullName",
      isRequired: true,
      paragraphText: "",
    },
    {
      id: crypto.randomUUID(),
      kind: "DATE",
      label: tt("templates.defaultFieldBirthDateFr", "Date de naissance"),
      labelAr: tt("templates.defaultFieldBirthDateAr", "تاريخ الازدياد"),
      fieldName: "client.birthDate",
      isRequired: false,
      paragraphText: "",
    },
    {
      id: crypto.randomUUID(),
      kind: "TEXT",
      label: tt("templates.defaultFieldCinFr", "Numéro CIN"),
      labelAr: tt("templates.defaultFieldCinAr", "رقم البطاقة الوطنية"),
      fieldName: "client.nationalId",
      isRequired: false,
      paragraphText: "",
    },
    {
      id: crypto.randomUUID(),
      kind: "PHONE",
      label: tt("templates.defaultFieldPhoneFr", "Téléphone"),
      labelAr: tt("templates.defaultFieldPhoneAr", "الهاتف"),
      fieldName: "client.phone",
      isRequired: false,
      paragraphText: "",
    },
    {
      id: crypto.randomUUID(),
      kind: "PARAGRAPH",
      label: "",
      labelAr: "",
      fieldName: "",
      isRequired: false,
      paragraphText: tt(
        "templates.defaultParagraph",
        "Je reconnais avoir pris connaissance des conditions ci-dessus.",
      ),
    },
    {
      id: crypto.randomUUID(),
      kind: "SIGNATURE",
      label: tt("templates.defaultSignatureFr", "Signature client"),
      labelAr: tt("templates.defaultSignatureAr", "توقيع الزبون"),
      fieldName: "",
      isRequired: false,
      paragraphText: "",
    },
  ])

  const [form, setForm] = useState({
    slug: "",
    title: "",
    titleAr: "",
    description: "",
    locale: "ar-MA",
    documentTypeId: NEW_OPTION,
    documentType: "",
    documentTypeAr: "",
    categoryId: NEW_OPTION,
    category: "",
    categoryAr: "",
    assetId: "none",
    contentHtml: "",
    contentCss: SIMPLE_DEFAULT_CSS,
    basePrice: "",
    pageFormat: "A4",
    marginTop: "1cm",
    marginRight: "1cm",
    marginBottom: "1cm",
    marginLeft: "1cm",
    simpleIncludeDateLine: true,
  })

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const selectedType = useMemo(
    () => taxonomy.find((item) => String(item.id) === form.documentTypeId),
    [form.documentTypeId, taxonomy],
  )

  const availableCategories = selectedType?.categories ?? []

  const defaultLabelAliases = useMemo(
    () => ({
      fullName: ["Nom complet", "الاسم الكامل"],
      birthDate: ["Date de naissance", "تاريخ الازدياد"],
      nationalId: ["Numéro CIN", "رقم البطاقة الوطنية"],
      phone: ["Téléphone", "الهاتف"],
      paragraph: [
        "Je reconnais avoir pris connaissance des conditions ci-dessus.",
        "أقرّ بأنني اطلعت على الشروط المذكورة أعلاه.",
      ],
      signature: ["Signature client", "توقيع الزبون"],
    }),
    [],
  )

  const getDefaultFrLabel = useCallback(
    (fieldName: string) => {
      if (fieldName === "client.fullName") return tt("templates.defaultFieldFullNameFr", "Nom complet")
      if (fieldName === "client.birthDate") return tt("templates.defaultFieldBirthDateFr", "Date de naissance")
      if (fieldName === "client.nationalId") return tt("templates.defaultFieldCinFr", "Numéro CIN")
      if (fieldName === "client.phone") return tt("templates.defaultFieldPhoneFr", "Téléphone")
      return ""
    },
    [tt],
  )

  const getDefaultArLabel = useCallback(
    (fieldName: string) => {
      if (fieldName === "client.fullName") return tt("templates.defaultFieldFullNameAr", "الاسم الكامل")
      if (fieldName === "client.birthDate") return tt("templates.defaultFieldBirthDateAr", "تاريخ الازدياد")
      if (fieldName === "client.nationalId") return tt("templates.defaultFieldCinAr", "رقم البطاقة الوطنية")
      if (fieldName === "client.phone") return tt("templates.defaultFieldPhoneAr", "الهاتف")
      return ""
    },
    [tt],
  )

  useEffect(() => {
    setSimpleBlocks((prev) =>
      prev.map((block) => {
        if (block.fieldName === "client.fullName" && defaultLabelAliases.fullName.includes(block.label)) {
          return {
            ...block,
            label: tt("templates.defaultFieldFullNameFr", "Nom complet"),
            labelAr: tt("templates.defaultFieldFullNameAr", "الاسم الكامل"),
          }
        }
        if (block.fieldName === "client.birthDate" && defaultLabelAliases.birthDate.includes(block.label)) {
          return {
            ...block,
            label: tt("templates.defaultFieldBirthDateFr", "Date de naissance"),
            labelAr: tt("templates.defaultFieldBirthDateAr", "تاريخ الازدياد"),
          }
        }
        if (block.fieldName === "client.nationalId" && defaultLabelAliases.nationalId.includes(block.label)) {
          return {
            ...block,
            label: tt("templates.defaultFieldCinFr", "Numéro CIN"),
            labelAr: tt("templates.defaultFieldCinAr", "رقم البطاقة الوطنية"),
          }
        }
        if (block.fieldName === "client.phone" && defaultLabelAliases.phone.includes(block.label)) {
          return {
            ...block,
            label: tt("templates.defaultFieldPhoneFr", "Téléphone"),
            labelAr: tt("templates.defaultFieldPhoneAr", "الهاتف"),
          }
        }
        if (block.kind === "PARAGRAPH" && defaultLabelAliases.paragraph.includes(block.paragraphText)) {
          return {
            ...block,
            paragraphText: tt(
              "templates.defaultParagraph",
              "Je reconnais avoir pris connaissance des conditions ci-dessus.",
            ),
          }
        }
        if (block.kind === "SIGNATURE" && defaultLabelAliases.signature.includes(block.label)) {
          return {
            ...block,
            label: tt("templates.defaultSignatureFr", "Signature client"),
            labelAr: tt("templates.defaultSignatureAr", "توقيع الزبون"),
          }
        }
        return block
      }),
    )
  }, [defaultLabelAliases, language, tt])

  const simpleGeneratedHtml = useMemo(
    () =>
      buildSimpleTemplateHtml({
        title: form.title.trim() || tt("templates.defaultTitle", "Nouveau modèle"),
        description: form.description,
        blocks: simpleBlocks,
        includeDateLine: form.simpleIncludeDateLine,
        dateLabel: tt("templates.dateLabel", "Date"),
        signatureFallbackLabel: tt("templates.signatureLabel", "Signature"),
      }),
    [form.description, form.simpleIncludeDateLine, form.title, simpleBlocks, tt],
  )

  const simpleGeneratedPreviewDoc = useMemo(
    () => `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${SIMPLE_DEFAULT_CSS}</style>
</head>
<body>
${simpleGeneratedHtml}
</body>
</html>`,
    [language, simpleGeneratedHtml],
  )

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const response = await fetch("/api/template-assets")
        if (!response.ok) {
          return
        }
        const data = await response.json()
        setAssets(data)
      } catch (error) {
        console.error("Asset load failed:", error)
      }
    }

    const loadTaxonomy = async () => {
      try {
        const response = await fetch("/api/template-taxonomy")
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as TaxonomyType[]
        setTaxonomy(data)
      } catch (error) {
        console.error("Taxonomy load failed:", error)
      }
    }

    loadAssets()
    loadTaxonomy()
  }, [])

  const onTypeChange = (value: string) => {
    if (value === NEW_OPTION) {
      setForm((prev) => ({
        ...prev,
        documentTypeId: NEW_OPTION,
        categoryId: NEW_OPTION,
        documentType: "",
        documentTypeAr: "",
        category: "",
        categoryAr: "",
      }))
      return
    }

    const existing = taxonomy.find((item) => String(item.id) === value)
    setForm((prev) => ({
      ...prev,
      documentTypeId: value,
      categoryId: NEW_OPTION,
      documentType: existing?.name ?? "",
      documentTypeAr: existing?.nameAr ?? "",
      category: "",
      categoryAr: "",
    }))
  }

  const onCategoryChange = (value: string) => {
    if (value === NEW_OPTION) {
      setForm((prev) => ({ ...prev, categoryId: NEW_OPTION, category: "", categoryAr: "" }))
      return
    }

    const existing = availableCategories.find((item) => String(item.id) === value)
    setForm((prev) => ({
      ...prev,
      categoryId: value,
      category: existing?.name ?? "",
      categoryAr: existing?.nameAr ?? "",
    }))
  }

  const moveBlock = (from: number, to: number) => {
    setSimpleBlocks((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const updateBlock = (id: string, patch: Partial<SimpleBlock>) => {
    setSimpleBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)))
  }

  const removeBlock = (id: string) => {
    setSimpleBlocks((prev) => prev.filter((block) => block.id !== id))
  }

  const submitTemplatePayload = async (
    payload: Record<string, unknown>,
    forceDuplicateOverride = false,
  ) => {
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        forceDuplicateOverride,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (response.status === 409 && data?.code === "DUPLICATE_CANDIDATE") {
      setDuplicateCandidates(Array.isArray(data.candidates) ? data.candidates : [])
      setPendingCreatePayload(payload)
      setIsDuplicateDialogOpen(true)
      return null
    }

    if (!response.ok) {
      throw new Error(data.message || "Create failed")
    }

    return data as { slug: string }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const title = form.title.trim()
      const documentTypeName = form.documentType.trim()
      const categoryName = form.category.trim()

      if (!title || !documentTypeName || !categoryName) {
        throw new Error(tt("templates.createMissingRequired", "Veuillez renseigner le titre, le type de document et la catégorie."))
      }

      const autoSlugBase = [documentTypeName, categoryName, title].filter(Boolean).join("-")
      const generatedSlug = slugify(autoSlugBase)

      const simpleFields = mapSimpleBlocksToFields(simpleBlocks)
      const contentHtml = mode === "simple" ? simpleGeneratedHtml : form.contentHtml.trim() || null
      const contentCss = mode === "simple" ? SIMPLE_DEFAULT_CSS : form.contentCss.trim() || null

      const payload: Record<string, unknown> = {
        slug: form.slug.trim() || generatedSlug || undefined,
        title,
        titleAr: form.titleAr.trim() || null,
        description: form.description.trim() || null,
        locale: form.locale.trim(),
        documentType: {
          name: documentTypeName,
          nameAr: form.documentTypeAr.trim() || null,
        },
        category: {
          name: categoryName,
          nameAr: form.categoryAr.trim() || null,
        },
        assetId: form.assetId === "none" ? null : form.assetId || null,
        contentHtml,
        contentCss,
        fields: mode === "simple" ? simpleFields : undefined,
        metadata:
          mode === "simple"
            ? {
                builderMode: "simple",
                simpleBlocks,
              }
            : undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        pdfOptions: {
          format: form.pageFormat.trim() || "A4",
          margin: {
            top: form.marginTop.trim() || "1cm",
            right: form.marginRight.trim() || "1cm",
            bottom: form.marginBottom.trim() || "1cm",
            left: form.marginLeft.trim() || "1cm",
          },
        },
      }

      const data = await submitTemplatePayload(payload, false)
      if (!data) {
        return
      }
      toast({ title: t("templates.createSuccess") })
      window.location.href = `/admin/templates/${data.slug}`
    } catch (error) {
      toast({
        title: t("templates.createError"),
        description: error instanceof Error ? error.message : "Create failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicateOverride = async () => {
    if (!pendingCreatePayload) {
      setIsDuplicateDialogOpen(false)
      return
    }

    setIsDuplicateDialogOpen(false)
    setIsSubmitting(true)
    try {
      const data = await submitTemplatePayload(pendingCreatePayload, true)
      if (!data) {
        return
      }
      toast({ title: t("templates.createSuccess") })
      window.location.href = `/admin/templates/${data.slug}`
    } catch (error) {
      toast({
        title: t("templates.createError"),
        description: error instanceof Error ? error.message : "Create failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card dir={dir}>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>{t("templates.createTitle")}</CardTitle>
          <CardDescription>{t("templates.createDescription")}</CardDescription>
        </div>
        <Tabs value={mode} onValueChange={(value) => setMode(value as EditorMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">{tt("templates.createModeSimple", "Mode assisté")}</TabsTrigger>
            <TabsTrigger value="developer">{tt("templates.createModeDeveloper", "Mode avancé")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-muted-foreground text-sm">
          {mode === "simple"
            ? tt("templates.createModeSimpleHint", "Parfait pour les administrateurs: saisie guidée sans HTML/CSS.")
            : tt("templates.createModeDeveloperHint", "Pour les profils techniques: édition HTML/CSS et réglages PDF avancés.")}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tt("templates.titleFrLabel", "Titre du modèle (FR)")}</Label>
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={tt("templates.titleFr", "Titre (FR)")} />
          </div>
          <div className="space-y-1.5">
            <Label>{tt("templates.titleArLabel", "Titre du modèle (AR)")}</Label>
            <Input value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} placeholder={t("templates.titleAr")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{tt("templates.descriptionLabel", "Description du modèle")}</Label>
          <Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder={t("templates.description")} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tt("templates.documentTypeLabel", "Type de document")}</Label>
            <Select value={form.documentTypeId} onValueChange={onTypeChange}>
              <SelectTrigger aria-label={tt("templates.documentTypeLabel", "Type de document")}>
                <SelectValue placeholder={tt("templates.documentTypeSelect", "Sélectionner un type de document")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_OPTION}>{tt("templates.createNewDocumentType", "Créer un nouveau type de document")}</SelectItem>
                {taxonomy.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.nameAr || item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{tt("templates.categoryLabel", "Catégorie")}</Label>
            <Select
              value={form.categoryId}
              onValueChange={onCategoryChange}
              disabled={form.documentTypeId === NEW_OPTION && !form.documentType.trim()}
            >
              <SelectTrigger aria-label={tt("templates.categoryLabel", "Catégorie")}>
                <SelectValue placeholder={tt("templates.categorySelect", "Sélectionner une catégorie")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_OPTION}>{tt("templates.createNewCategory", "Créer une nouvelle catégorie")}</SelectItem>
                {availableCategories.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.nameAr || item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(form.documentTypeId === NEW_OPTION || form.categoryId === NEW_OPTION) && (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={form.documentType}
              onChange={(event) => update("documentType", event.target.value)}
              placeholder={tt("templates.documentTypeFr", "Type de document (FR)")}
            />
            <Input
              value={form.documentTypeAr}
              onChange={(event) => update("documentTypeAr", event.target.value)}
              placeholder={tt("templates.documentTypeAr", "Type de document (AR)")}
            />
            <Input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder={tt("templates.categoryFr", "Catégorie (FR)")} />
            <Input
              value={form.categoryAr}
              onChange={(event) => update("categoryAr", event.target.value)}
              placeholder={tt("templates.categoryAr", "Catégorie (AR)")}
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tt("templates.localeLabel", "Langue du modèle")}</Label>
            <Select value={form.locale} onValueChange={(value) => update("locale", value)}>
              <SelectTrigger aria-label={tt("templates.localeLabel", "Langue du modèle")}>
                <SelectValue placeholder={t("templates.locale")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr-MA">fr-MA</SelectItem>
                <SelectItem value="ar-MA">ar-MA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{tt("templates.basePriceLabel", "Prix unitaire (MAD)")}</Label>
            <Input
              value={form.basePrice}
              onChange={(event) => update("basePrice", event.target.value)}
              placeholder={t("templates.basePrice")}
              type="number"
              inputMode="decimal"
            />
          </div>
        </div>

        {mode === "simple" ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <h3 className="font-medium">{tt("templates.simpleBuilderTitle", "Éditeur guidé du contenu")}</h3>
              <p className="text-muted-foreground text-sm">
                {tt("templates.simpleBuilderDescription", "Rédigez le contenu métier. Le système génère automatiquement la structure PDF.")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSimpleBlocks((prev) => [...prev, createNewBlock("TEXT")])}>
                <Plus className="h-4 w-4" /> {tt("templates.quickAddText", "Ajouter un champ texte")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSimpleBlocks((prev) => [
                    ...prev,
                    createNewBlock("DATE", {
                      newFieldLabel: tt("templates.newFieldLabel", "Nouveau champ"),
                      newParagraphText: tt("templates.newParagraphText", "Nouveau paragraphe"),
                    }),
                  ])
                }
              >
                <Plus className="h-4 w-4" /> {tt("templates.quickAddDate", "Ajouter une date")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSimpleBlocks((prev) => [
                    ...prev,
                    createNewBlock("PHONE", {
                      newFieldLabel: tt("templates.newFieldLabel", "Nouveau champ"),
                      newParagraphText: tt("templates.newParagraphText", "Nouveau paragraphe"),
                    }),
                  ])
                }
              >
                <Plus className="h-4 w-4" /> {tt("templates.quickAddPhone", "Ajouter un téléphone")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSimpleBlocks((prev) => [
                    ...prev,
                    createNewBlock("PARAGRAPH", {
                      newFieldLabel: tt("templates.newFieldLabel", "Nouveau champ"),
                      newParagraphText: tt("templates.newParagraphText", "Nouveau paragraphe"),
                    }),
                  ])
                }
              >
                <Plus className="h-4 w-4" /> {tt("templates.quickAddParagraph", "Ajouter un paragraphe")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSimpleBlocks((prev) => [
                    ...prev,
                    createNewBlock("SIGNATURE", {
                      newFieldLabel: tt("templates.newFieldLabel", "Nouveau champ"),
                      newParagraphText: tt("templates.newParagraphText", "Nouveau paragraphe"),
                    }),
                  ])
                }
              >
                <Plus className="h-4 w-4" /> {tt("templates.quickAddSignature", "Ajouter une signature")}
              </Button>
            </div>

            <div className="space-y-3">
              {simpleBlocks.map((block, index) => {
                const isField = !["PARAGRAPH", "SIGNATURE"].includes(block.kind)
                const defaultFrLabel = isField ? getDefaultFrLabel(block.fieldName) : ""
                const defaultArLabel = isField ? getDefaultArLabel(block.fieldName) : ""
                const isDefaultFrValue = isField && !!defaultFrLabel && block.label.trim() === defaultFrLabel
                const isDefaultArValue = isField && !!defaultArLabel && block.labelAr.trim() === defaultArLabel
                const defaultParagraph = tt(
                  "templates.defaultParagraph",
                  "Je reconnais avoir pris connaissance des conditions ci-dessus.",
                )
                const isDefaultParagraphValue =
                  block.kind === "PARAGRAPH" && block.paragraphText.trim() === defaultParagraph
                const defaultSignature =
                  tt("templates.defaultSignatureFr", "Signature client")
                const isDefaultSignatureValue =
                  block.kind === "SIGNATURE" && block.label.trim() === defaultSignature
                return (
                  <div key={block.id} className="space-y-3 rounded-md border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <Select value={block.kind} onValueChange={(value) => updateBlock(block.id, { kind: value as SimpleBlockKind })}>
                          <SelectTrigger
                            className="w-full sm:w-[220px]"
                            aria-label={tt("templates.blockTypeLabel", "Type de bloc")}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEXT">{tt("templates.blockTypeText", "Texte")}</SelectItem>
                            <SelectItem value="DATE">{tt("templates.blockTypeDate", "Date")}</SelectItem>
                            <SelectItem value="PHONE">{tt("templates.blockTypePhone", "Téléphone")}</SelectItem>
                            <SelectItem value="NUMBER">{tt("templates.blockTypeNumber", "Nombre")}</SelectItem>
                            <SelectItem value="PARAGRAPH">{tt("templates.blockTypeParagraph", "Paragraphe")}</SelectItem>
                            <SelectItem value="SIGNATURE">{tt("templates.blockTypeSignature", "Signature")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(index, index - 1)} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(index, index + 1)} disabled={index === simpleBlocks.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(block.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isField ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>{tt("templates.blockLabelFrLabel", "Libellé visible (FR)")}</Label>
                          <Input
                            value={block.label}
                            onChange={(event) => updateBlock(block.id, { label: event.target.value })}
                            placeholder={tt("templates.blockLabelFr", "Ex: Nom complet")}
                            className={isDefaultFrValue ? "text-muted-foreground" : undefined}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{tt("templates.blockLabelArLabel", "Libellé visible (AR)")}</Label>
                          <Input
                            value={block.labelAr}
                            onChange={(event) => updateBlock(block.id, { labelAr: event.target.value })}
                            placeholder={tt("templates.blockLabelAr", "مثال: الاسم الكامل")}
                            className={isDefaultArValue ? "text-muted-foreground" : undefined}
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-muted-foreground text-xs">
                            {tt(
                              "templates.blockVariableHiddenHint",
                              "La clé technique du champ est gérée automatiquement en arrière-plan.",
                            )}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={block.isRequired} onCheckedChange={(checked) => updateBlock(block.id, { isRequired: checked === true })} />
                          <span>{tt("templates.blockRequired", "Champ obligatoire")}</span>
                        </label>
                      </div>
                    ) : block.kind === "PARAGRAPH" ? (
                      <Textarea
                        value={block.paragraphText}
                        onChange={(event) => updateBlock(block.id, { paragraphText: event.target.value })}
                        placeholder={tt("templates.blockParagraphPlaceholder", "Contenu du paragraphe")}
                        className={isDefaultParagraphValue ? "text-muted-foreground" : undefined}
                      />
                    ) : (
                      <div className="space-y-1">
                        <Label>{tt("templates.blockSignatureLabelTitle", "Intitulé de la signature")}</Label>
                        <Input
                          value={block.label}
                          onChange={(event) => updateBlock(block.id, { label: event.target.value })}
                          placeholder={tt("templates.blockSignatureLabel", "Ex: Signature client")}
                          className={isDefaultSignatureValue ? "text-muted-foreground" : undefined}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="mb-2 font-medium">
                {tt("templates.simpleFieldCount", "Nombre de champs du formulaire")}: {mapSimpleBlocksToFields(simpleBlocks).length}
              </p>
              <p className="text-muted-foreground text-xs">
                {tt("templates.simplePlaceholderHint", "Le moteur remplit automatiquement les données client dans le document.")}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.simpleIncludeDateLine}
                onCheckedChange={(checked) => update("simpleIncludeDateLine", checked === true)}
              />
              <span>{tt("templates.simpleIncludeDate", "Ajouter la ligne de date")}</span>
            </label>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" /> {tt("templates.generatedHtmlPreview", "Aperçu HTML généré")}
              </div>
              <Tabs value={simplePreviewMode} onValueChange={(value) => setSimplePreviewMode(value as "rendered" | "code")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rendered">{tt("templates.previewRendered", "Rendu visuel")}</TabsTrigger>
                  <TabsTrigger value="code">{tt("templates.previewCode", "Code HTML")}</TabsTrigger>
                </TabsList>
              </Tabs>
              {simplePreviewMode === "rendered" ? (
                <div className="overflow-hidden rounded-md border bg-white">
                  <iframe
                    title="simple-template-render-preview"
                    srcDoc={simpleGeneratedPreviewDoc}
                    className="h-[420px] w-full"
                    sandbox=""
                  />
                </div>
              ) : (
                <Textarea
                  value={simpleGeneratedHtml}
                  readOnly
                  className="min-h-[220px] font-mono text-xs"
                  aria-label={tt("templates.generatedHtmlPreview", "Aperçu HTML généré")}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>{t("templates.slug")}</Label>
              <Input
                value={form.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder={tt("templates.slugOptional", "Identifiant (optionnel, auto-généré si vide)")}
              />
            </div>

            <Textarea
              value={form.contentHtml}
              onChange={(event) => update("contentHtml", event.target.value)}
              placeholder={t("templates.htmlTemplate")}
              className="min-h-[220px] font-mono text-xs"
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("templates.cssTemplate")}</p>
              <Textarea
                value={form.contentCss}
                onChange={(event) => update("contentCss", event.target.value)}
                placeholder={t("templates.cssTemplate")}
                className="min-h-[160px] font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("templates.pdfSettings")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.pageFormat}
                  onChange={(event) => update("pageFormat", event.target.value)}
                  placeholder={t("templates.pageSize")}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={form.marginTop} onChange={(event) => update("marginTop", event.target.value)} placeholder={t("templates.marginTop")} />
                  <Input
                    value={form.marginRight}
                    onChange={(event) => update("marginRight", event.target.value)}
                    placeholder={t("templates.marginRight")}
                  />
                  <Input
                    value={form.marginBottom}
                    onChange={(event) => update("marginBottom", event.target.value)}
                    placeholder={t("templates.marginBottom")}
                  />
                  <Input
                    value={form.marginLeft}
                    onChange={(event) => update("marginLeft", event.target.value)}
                    placeholder={t("templates.marginLeft")}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-1.5">
          <Label>{tt("templates.assetLabel", "Pièce jointe modèle")}</Label>
          <Select value={form.assetId} onValueChange={(value) => update("assetId", value)}>
            <SelectTrigger aria-label={tt("templates.assetLabel", "Pièce jointe modèle")}>
              <SelectValue placeholder={t("templates.asset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("templates.createPending") : t("templates.createAction")}
        </Button>
      </CardContent>
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tt("templates.duplicateWarningTitle", "Doublon potentiel détecté")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tt(
                "templates.duplicateWarningDescription",
                "Un modèle similaire existe déjà. Voulez-vous continuer malgré tout ?",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{tt("templates.duplicateWarningCandidates", "Modèles similaires :")}</p>
            <ul className="list-disc space-y-1 ps-5">
              {duplicateCandidates.map((candidate) => (
                <li key={`${candidate.slug}-${candidate.updatedAt}`}>
                  <span className="font-medium">{candidate.title}</span> ({candidate.slug})
                  {candidate.reasons?.length ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {tt("templates.duplicateWarningReasons", "Raisons")}:
                      </span>{" "}
                      {candidate.reasons.join(", ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {tt("templates.duplicateWarningCancel", "Annuler")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateOverride}>
              {tt("templates.duplicateWarningOverride", "Continuer quand même")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
