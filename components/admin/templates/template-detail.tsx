"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Download, FileText, LayoutDashboard, PanelLeftClose, Users2 } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"
import { useToast } from "@/hooks/use-toast"

export type TemplateDetailData = {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  description?: string | null
  locale: string
  version: number
  isActive: boolean
  contentHtml?: string | null
  createdAt: string
  updatedAt: string
  documentType: {
    name: string
    nameAr?: string | null
  }
  category: {
    name: string
    nameAr?: string | null
  }
  asset?: {
    id: string
    fileName: string
    filePath: string
    version: number | null
  } | null
  metadata?: Record<string, unknown> | null
  requestedByName?: string | null
  requestedAt?: string | null
  activityTimeline?: {
    type: "requested" | "reviewed" | "archived" | "duplicated"
    at: string
    actorName?: string | null
    note?: string | null
  }[]
  participantRoles: {
    roleKey: string
    roleLabel: string
    roleLabelAr?: string | null
    description?: string | null
    isRequired: boolean
    minParticipants: number
    maxParticipants?: number | null
  }[]
  fieldGroups: {
    id: number
    displayOrder: number
    isRequired: boolean
    group: {
      code: string
      name: string
      nameAr?: string | null
      description?: string | null
      fields: {
        fieldName: string
        fieldLabel: string
        fieldLabelAr?: string | null
        fieldType: string
        isRequired: boolean
      }[]
    }
  }[]
  fields: {
    id: string
    fieldName: string
    fieldLabel: string
    fieldLabelAr?: string | null
    fieldType: string
    isRequired: boolean
    allowMultiple: boolean
    section?: string | null
    sectionAr?: string | null
    dataSource?: string | null
    participantRoleKey?: string | null
    displayOrder: number
    groupCode?: string | null
  }[]
}

type TemplateDetailProps = {
  template: TemplateDetailData
}

export function TemplateDetail({ template }: TemplateDetailProps) {
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    ok: boolean
    missingRequired: { fieldName: string; label: string }[]
    unusedFields: { fieldName: string; label: string; required: boolean }[]
    unknownPlaceholders: { fieldName: string }[]
  } | null>(null)
  const [title, setTitle] = useState(template.title)
  const [titleAr, setTitleAr] = useState(template.titleAr ?? "")
  const [description, setDescription] = useState(template.description ?? "")
  const [locale, setLocale] = useState(template.locale)
  const [isActive, setIsActive] = useState(template.isActive)
  const [contentHtml, setContentHtml] = useState(template.contentHtml ?? "")
  const metadata = useMemo(
    () => (template.metadata && typeof template.metadata === "object" ? template.metadata : {}),
    [template.metadata],
  )
  const storedPdfOptions =
    metadata?.pdfOptions && typeof metadata.pdfOptions === "object"
      ? (metadata.pdfOptions as Record<string, unknown>)
      : {}
  const storedMargin =
    storedPdfOptions?.margin && typeof storedPdfOptions.margin === "object"
      ? (storedPdfOptions.margin as Record<string, unknown>)
      : {}
  const [contentCss, setContentCss] = useState(typeof metadata?.htmlCss === "string" ? metadata.htmlCss : "")
  const [basePrice, setBasePrice] = useState(
    typeof metadata?.basePrice === "number" ? metadata.basePrice.toString() : "",
  )
  const [pageFormat, setPageFormat] = useState(typeof storedPdfOptions?.format === "string" ? storedPdfOptions.format : "A4")
  const [marginTop, setMarginTop] = useState(typeof storedMargin?.top === "string" ? storedMargin.top : "1cm")
  const [marginRight, setMarginRight] = useState(typeof storedMargin?.right === "string" ? storedMargin.right : "1cm")
  const [marginBottom, setMarginBottom] = useState(typeof storedMargin?.bottom === "string" ? storedMargin.bottom : "1cm")
  const [marginLeft, setMarginLeft] = useState(typeof storedMargin?.left === "string" ? storedMargin.left : "1cm")
  const [assetId, setAssetId] = useState(template.asset?.id ?? "none")
  const [assetOptions, setAssetOptions] = useState<{ id: string; fileName: string }[]>([])
  const [fieldsJson, setFieldsJson] = useState(
    JSON.stringify(
      template.fields.map((field) => ({
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldLabelAr: field.fieldLabelAr ?? undefined,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        allowMultiple: field.allowMultiple,
        section: field.section ?? undefined,
        sectionAr: field.sectionAr ?? undefined,
        dataSource: field.dataSource ?? undefined,
        participantRoleKey: field.participantRoleKey ?? undefined,
        displayOrder: field.displayOrder,
      })),
      null,
      2,
    ),
  )
  const [rolesJson, setRolesJson] = useState(
    JSON.stringify(
      template.participantRoles.map((role) => ({
        roleKey: role.roleKey,
        roleLabel: role.roleLabel,
        roleLabelAr: role.roleLabelAr ?? undefined,
        description: role.description ?? undefined,
        isRequired: role.isRequired,
        minParticipants: role.minParticipants,
        maxParticipants: role.maxParticipants ?? undefined,
      })),
      null,
      2,
    ),
  )
  const previewSignature = useMemo(() => `${contentHtml}\n${contentCss}`, [contentCss, contentHtml])
  const [lastPreviewedSignature, setLastPreviewedSignature] = useState<string | null>(null)

  const timelineLabels: Record<NonNullable<TemplateDetailData["activityTimeline"]>[number]["type"], string> = {
    requested: t("templates.timeline.requested"),
    reviewed: t("templates.timeline.reviewed"),
    duplicated: t("templates.timeline.duplicated"),
    archived: t("templates.timeline.archived"),
  }

  const parsedFieldsCount = useMemo(() => {
    try {
      const parsed = JSON.parse(fieldsJson)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }, [fieldsJson])

  const parsedRolesCount = useMemo(() => {
    try {
      const parsed = JSON.parse(rolesJson)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }, [rolesJson])

  const isBasePriceValid = useMemo(() => {
    if (!basePrice.trim()) return false
    const value = Number.parseFloat(basePrice)
    return Number.isFinite(value) && value >= 0
  }, [basePrice])

  const publishChecklist = useMemo(
    () => [
      { key: "html", label: t("templates.checklist.html"), ok: Boolean(contentHtml.trim()) },
      { key: "fields", label: t("templates.checklist.fields"), ok: parsedFieldsCount > 0 },
      { key: "roles", label: t("templates.checklist.roles"), ok: parsedRolesCount > 0 },
      { key: "price", label: t("templates.checklist.price"), ok: isBasePriceValid },
      {
        key: "preview",
        label: t("templates.checklist.preview"),
        ok: lastPreviewedSignature === previewSignature,
      },
      {
        key: "validation",
        label: t("templates.checklist.validation"),
        ok: validationResult ? validationResult.ok : false,
      },
    ],
    [
      contentHtml,
      isBasePriceValid,
      lastPreviewedSignature,
      parsedFieldsCount,
      parsedRolesCount,
      previewSignature,
      t,
      validationResult,
    ],
  )
  const checklistReadyCount = useMemo(
    () => publishChecklist.filter((item) => item.ok).length,
    [publishChecklist],
  )
  const isChecklistReady = checklistReadyCount === publishChecklist.length

  const groupedFields = useMemo(() => {
    const sections = new Map<string, TemplateDetailData["fields"]>()
    for (const field of template.fields) {
      const key = field.section || "__default__"
      if (!sections.has(key)) sections.set(key, [])
      sections.get(key)!.push(field)
    }
    return sections
  }, [template.fields])

  const previewHtml = useMemo(
    () => buildPreviewHtml(contentHtml, contentCss),
    [contentHtml, contentCss],
  )

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const response = await fetch("/api/template-assets")
        if (!response.ok) {
          return
        }
        const data = await response.json()
        setAssetOptions(data)
      } catch (error) {
        console.error("Asset load failed:", error)
      }
    }

    loadAssets()
  }, [])

  useEffect(() => {
    if (!assetOptions.length) return
    if (!assetId) {
      setAssetId("none")
    }
  }, [assetOptions, assetId])

  const handleConfirmPublish = async () => {
    setIsPublishing(true)
    try {
      const validation = await fetch(`/api/templates/${template.slug}/validate`)
      if (!validation.ok) {
        const data = await validation.json()
        throw new Error(data.message || "Validation failed")
      }
      const result = await validation.json()
      setValidationResult(result)
      if (!result.ok || !contentHtml.trim()) {
        throw new Error(t("templates.validationBlocking"))
      }
      if (!parsedFieldsCount || !parsedRolesCount || !isBasePriceValid) {
        throw new Error(t("templates.checklist.blocking"))
      }
      if (lastPreviewedSignature !== previewSignature) {
        throw new Error(t("templates.checklist.previewBlocking"))
      }
      const response = await fetch(`/api/templates/${template.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: true,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Publish failed")
      }
      toast({ title: t("templates.publishSuccess") })
      window.location.reload()
    } catch (error) {
      toast({
        title: t("templates.publishError"),
        description: error instanceof Error ? error.message : "Publish failed",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
      setIsPublishConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/templates" className="hover:text-foreground">
              {t("templates.backToList")}
            </Link>
            <span>/</span>
            <span>{template.slug}</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            {template.titleAr || template.title}
            <Badge variant="outline" className="font-normal">
              {t("templates.version")}: {template.version}
            </Badge>
            {!template.isActive ? (
              <Badge variant="secondary">{t("templates.statusDraft")}</Badge>
            ) : null}
          </h1>
          {template.requestedByName || template.requestedAt ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {template.requestedByName ? (
                <span>{t("templates.review.requestedBy")}: {template.requestedByName}</span>
              ) : null}
              {template.requestedAt ? (
                <span>
                  {t("templates.review.requestedAt")}:{" "}
                  {new Date(template.requestedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="text-muted-foreground leading-relaxed">
            {template.description || t("templates.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {t("templates.locale")}: {template.locale.toUpperCase()}
          </Badge>
          <Badge variant={template.isActive ? "default" : "secondary"}>
            {template.isActive ? t("templates.statusActive") : t("templates.statusInactive")}
          </Badge>
          {!template.contentHtml ? (
            <Badge variant="destructive">{t("templates.missingHtml")}</Badge>
          ) : null}
          <Button
            variant="destructive"
            onClick={async () => {
              if (!window.confirm(t("templates.deleteConfirm"))) {
                return
              }
              setIsSaving(true)
              try {
                const response = await fetch(`/api/templates/${template.slug}`, {
                  method: "DELETE",
                })
                if (!response.ok) {
                  const data = await response.json()
                  throw new Error(data.message || "Delete failed")
                }
                toast({ title: t("templates.deleteSuccess") })
                window.location.href = "/admin/templates"
              } catch (error) {
                toast({
                  title: t("templates.deleteError") ,
                  description: error instanceof Error ? error.message : "Delete failed",
                  variant: "destructive",
                })
              } finally {
                setIsSaving(false)
              }
            }}
            disabled={isSaving}
          >
            {t("templates.deleteAction")}
          </Button>
          {template.asset ? (
            <Button asChild variant="outline" className="gap-2">
              <a href={`/api/templates/${template.slug}/asset`} download>
                <Download className="h-4 w-4" />
                {t("templates.downloadTemplate")}
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              {t("templates.metadata")}
            </CardTitle>
            <CardDescription>{t("templates.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MetadataItem label={t("templates.documentType")} value={template.documentType.nameAr || template.documentType.name} />
            <MetadataItem label={t("templates.category")} value={template.category.nameAr || template.category.name} />
            <MetadataItem
              label={t("templates.createdAt")}
              value={new Date(template.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            />
            <MetadataItem
              label={t("templates.updatedAt")}
              value={new Date(template.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            />
            <MetadataItem label={t("templates.slug")} value={template.slug} />
            <MetadataItem
              label={t("templates.fields")}
              value={t("templates.fieldsCount", { count: template.fields.length })}
            />
            {template.requestedByName ? (
              <MetadataItem label={t("templates.review.requestedBy")} value={template.requestedByName} />
            ) : null}
            {template.requestedAt ? (
              <MetadataItem
                label={t("templates.review.requestedAt")}
                value={new Date(template.requestedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("templates.asset")}</CardTitle>
            <CardDescription>{template.asset ? template.asset.filePath : t("templates.assetUnavailable")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{t("templates.assetPath")}</span>
              <span className="font-medium truncate max-w-[180px]" title={template.asset?.filePath}>
                {template.asset?.filePath ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("templates.assetVersion")}</span>
              <span className="font-medium">
                {template.asset?.version ?? template.version}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates.editTitle")}</CardTitle>
          <CardDescription>{t("templates.editDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("templates.title")} />
            <Input value={titleAr} onChange={(event) => setTitleAr(event.target.value)} placeholder={t("templates.titleAr")} />
          </div>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("templates.description")}
          />
          <Textarea
            value={contentHtml}
            onChange={(event) => setContentHtml(event.target.value)}
            placeholder={t("templates.htmlTemplate")}
            className="min-h-[200px] font-mono text-xs"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("templates.basePrice")}</p>
            <Input
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder={t("templates.basePrice")}
              type="number"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("templates.cssTemplate")}</p>
            <Textarea
              value={contentCss}
              onChange={(event) => setContentCss(event.target.value)}
              placeholder={t("templates.cssTemplate")}
              className="min-h-[160px] font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("templates.pdfSettings")}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={pageFormat}
                onChange={(event) => setPageFormat(event.target.value)}
                placeholder={t("templates.pageSize")}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={marginTop}
                  onChange={(event) => setMarginTop(event.target.value)}
                  placeholder={t("templates.marginTop")}
                />
                <Input
                  value={marginRight}
                  onChange={(event) => setMarginRight(event.target.value)}
                  placeholder={t("templates.marginRight")}
                />
                <Input
                  value={marginBottom}
                  onChange={(event) => setMarginBottom(event.target.value)}
                  placeholder={t("templates.marginBottom")}
                />
                <Input
                  value={marginLeft}
                  onChange={(event) => setMarginLeft(event.target.value)}
                  placeholder={t("templates.marginLeft")}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/templates/${template.slug}/render-test`, {
                    method: "POST",
                  })
                  if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.message || "Render failed")
                  }
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  window.open(url, "_blank")
                  setLastPreviewedSignature(previewSignature)
                } catch (error) {
                  toast({
                    title: t("templates.previewError"),
                    description: error instanceof Error ? error.message : "Render failed",
                    variant: "destructive",
                  })
                }
              }}
              disabled={isSaving}
            >
              {t("templates.previewAction")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                setIsSaving(true)
                try {
                  const response = await fetch(`/api/templates/${template.slug}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    titleAr: titleAr || null,
                      description: description || null,
                      contentHtml: contentHtml || null,
                      contentCss: contentCss || null,
                      basePrice: basePrice ? Number(basePrice) : null,
                      pdfOptions: {
                        format: pageFormat,
                        margin: {
                        top: marginTop,
                        right: marginRight,
                        bottom: marginBottom,
                        left: marginLeft,
                      },
                    },
                    locale,
                    isActive,
                    assetId: assetId === "none" ? null : assetId || null,
                  }),
                })
                  if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.message || "Update failed")
                  }
                  const preview = await fetch(`/api/templates/${template.slug}/render-test`, {
                    method: "POST",
                  })
                  if (!preview.ok) {
                    const data = await preview.json()
                    throw new Error(data.message || "Render failed")
                  }
                  const blob = await preview.blob()
                  const url = window.URL.createObjectURL(blob)
                  window.open(url, "_blank")
                  setLastPreviewedSignature(previewSignature)
                } catch (error) {
                  toast({
                    title: t("templates.previewError"),
                    description: error instanceof Error ? error.message : "Render failed",
                    variant: "destructive",
                  })
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
            >
              {t("templates.previewSaveAction")}
            </Button>
          </div>
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <div className="mb-4 rounded-md border bg-background p-3">
              <p className="mb-2 text-sm font-medium">{t("templates.checklist.title")}</p>
              <p className="mb-2 text-xs text-muted-foreground">
                {checklistReadyCount}/{publishChecklist.length} {t("templates.checklist.readyCount")}
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {publishChecklist.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                    <span>{item.label}</span>
                    <Badge variant={item.ok ? "default" : "secondary"}>
                      {item.ok ? t("templates.checklist.ready") : t("templates.checklist.missing")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isValidating || isPublishing}
                onClick={async () => {
                  setIsValidating(true)
                  try {
                    const response = await fetch(`/api/templates/${template.slug}/validate`)
                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.message || "Validation failed")
                    }
                    const data = await response.json()
                    setValidationResult(data)
                    toast({ title: data.ok ? t("templates.validationSuccess") : t("templates.validationWarning") })
                  } catch (error) {
                    toast({
                      title: t("templates.validationError"),
                      description: error instanceof Error ? error.message : "Validation failed",
                      variant: "destructive",
                    })
                  } finally {
                    setIsValidating(false)
                  }
                }}
              >
                {isValidating ? t("templates.validationPending") : t("templates.validationAction")}
              </Button>
              <Button
                type="button"
                disabled={isPublishing}
                onClick={() => setIsPublishConfirmOpen(true)}
              >
                {isPublishing ? t("templates.publishPending") : t("templates.publishAction")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isPublishing}
                onClick={async () => {
                  if (!window.confirm(t("templates.unpublishConfirm"))) {
                    return
                  }
                  setIsPublishing(true)
                  try {
                    const response = await fetch(`/api/templates/${template.slug}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        isActive: false,
                      }),
                    })
                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.message || "Unpublish failed")
                    }
                    toast({ title: t("templates.unpublishSuccess") })
                    window.location.reload()
                  } catch (error) {
                    toast({
                      title: t("templates.unpublishError"),
                      description: error instanceof Error ? error.message : "Unpublish failed",
                      variant: "destructive",
                    })
                  } finally {
                    setIsPublishing(false)
                  }
                }}
              >
                {t("templates.unpublishAction")}
              </Button>
            </div>
            {validationResult ? (
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                {validationResult.missingRequired.length ? (
                  <div>
                    <p className="font-medium text-destructive">{t("templates.validationMissingRequired")}</p>
                    <ul className="mt-1 list-disc pl-4">
                      {validationResult.missingRequired.map((item) => (
                        <li key={item.fieldName}>{item.label} ({item.fieldName})</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {validationResult.unknownPlaceholders.length ? (
                  <div>
                    <p className="font-medium text-destructive">{t("templates.validationUnknownPlaceholders")}</p>
                    <ul className="mt-1 list-disc pl-4">
                      {validationResult.unknownPlaceholders.map((item) => (
                        <li key={item.fieldName}>{item.fieldName}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {validationResult.unusedFields.length ? (
                  <div>
                    <p className="font-medium">{t("templates.validationUnusedFields")}</p>
                    <ul className="mt-1 list-disc pl-4">
                      {validationResult.unusedFields.map((item) => (
                        <li key={item.fieldName}>
                          {item.label} ({item.fieldName}){item.required ? " *" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {!validationResult.missingRequired.length &&
                !validationResult.unknownPlaceholders.length &&
                !validationResult.unusedFields.length ? (
                  <p className="text-emerald-600">{t("templates.validationClean")}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={locale} onChange={(event) => setLocale(event.target.value)} placeholder={t("templates.locale")} />
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">{t("templates.statusActive")}</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger>
              <SelectValue placeholder={t("templates.asset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {assetOptions.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={async () => {
              setIsSaving(true)
              try {
                const response = await fetch(`/api/templates/${template.slug}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    titleAr: titleAr || null,
                    description: description || null,
                    contentHtml: contentHtml || null,
                    contentCss: contentCss || null,
                    basePrice: basePrice ? Number(basePrice) : null,
                    pdfOptions: {
                      format: pageFormat,
                      margin: {
                        top: marginTop,
                        right: marginRight,
                        bottom: marginBottom,
                        left: marginLeft,
                      },
                    },
                    locale,
                    isActive,
                    assetId: assetId === "none" ? null : assetId || null,
                  }),
                })
                if (!response.ok) {
                  const data = await response.json()
                  throw new Error(data.message || "Update failed")
                }
                toast({ title: t("templates.editSuccess") })
              } catch (error) {
                toast({
                  title: t("templates.editError"),
                  description: error instanceof Error ? error.message : "Update failed",
                  variant: "destructive",
                })
              } finally {
                setIsSaving(false)
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? t("templates.editPending") : t("templates.editAction")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates.editFieldsTitle")}</CardTitle>
          <CardDescription>{t("templates.editFieldsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <iframe
              title="template-preview"
              className="h-[480px] w-full"
              sandbox=""
              srcDoc={previewHtml}
            />
          </div>
          <Textarea
            value={fieldsJson}
            onChange={(event) => setFieldsJson(event.target.value)}
            className="min-h-[240px] font-mono text-xs"
          />
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true)
              try {
                const fields = JSON.parse(fieldsJson)
                const response = await fetch(`/api/templates/${template.slug}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fields,
                    replaceFields: true,
                  }),
                })
                if (!response.ok) {
                  const data = await response.json()
                  throw new Error(data.message || "Update failed")
                }
                toast({ title: t("templates.editFieldsSuccess") })
              } catch (error) {
                toast({
                  title: t("templates.editFieldsError"),
                  description: error instanceof Error ? error.message : "Update failed",
                  variant: "destructive",
                })
              } finally {
                setIsSaving(false)
              }
            }}
          >
            {t("templates.editFieldsAction")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates.editRolesTitle")}</CardTitle>
          <CardDescription>{t("templates.editRolesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rolesJson}
            onChange={(event) => setRolesJson(event.target.value)}
            className="min-h-[200px] font-mono text-xs"
          />
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true)
              try {
                const participantRoles = JSON.parse(rolesJson)
                const response = await fetch(`/api/templates/${template.slug}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    participantRoles,
                    replaceParticipantRoles: true,
                  }),
                })
                if (!response.ok) {
                  const data = await response.json()
                  throw new Error(data.message || "Update failed")
                }
                toast({ title: t("templates.editRolesSuccess") })
              } catch (error) {
                toast({
                  title: t("templates.editRolesError"),
                  description: error instanceof Error ? error.message : "Update failed",
                  variant: "destructive",
                })
              } finally {
                setIsSaving(false)
              }
            }}
          >
            {t("templates.editRolesAction")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            {t("templates.participants")}
          </CardTitle>
          <CardDescription>{t("templates.participantCount", { count: template.participantRoles.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {template.participantRoles.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("templates.participantRole")}</TableHead>
                  <TableHead>{t("templates.required")}</TableHead>
                  <TableHead>{t("templates.minParticipants")}</TableHead>
                  <TableHead>{t("templates.maxParticipants")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {template.participantRoles.map((role) => (
                  <TableRow key={role.roleKey}>
                    <TableCell className="font-medium">
                      {role.roleLabelAr || role.roleLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isRequired ? "default" : "secondary"}>
                        {role.isRequired ? t("templates.statusActive") : t("templates.statusInactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.minParticipants}</TableCell>
                    <TableCell>{role.maxParticipants ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("templates.noParticipantRoles")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates.fieldGroups")}</CardTitle>
          <CardDescription>{t("templates.participantCount", { count: template.fieldGroups.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {template.fieldGroups.length ? (
            <Accordion type="multiple" className="w-full">
              {template.fieldGroups
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((assignment) => (
                  <AccordionItem key={assignment.id} value={`${assignment.id}`}>
                    <AccordionTrigger className="text-start">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{assignment.group.code}</Badge>
                        <span>{assignment.group.nameAr || assignment.group.name}</span>
                        {!assignment.isRequired ? (
                          <Badge variant="secondary" className="font-normal">
                            {t("templates.statusInactive")}
                          </Badge>
                        ) : null}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 p-2">
                        {assignment.group.description ? (
                          <p className="text-sm text-muted-foreground">{assignment.group.description}</p>
                        ) : null}
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("templates.fieldLabel")}</TableHead>
                                <TableHead>{t("templates.fieldName")}</TableHead>
                                <TableHead>{t("templates.fieldType")}</TableHead>
                                <TableHead>{t("templates.required")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assignment.group.fields.map((field) => (
                                <TableRow key={field.fieldName}>
                                  <TableCell>{field.fieldLabelAr || field.fieldLabel}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{field.fieldName}</TableCell>
                                  <TableCell>{field.fieldType}</TableCell>
                                  <TableCell>
                                    <Badge variant={field.isRequired ? "default" : "secondary"}>
                                      {field.isRequired ? t("templates.statusActive") : t("templates.statusInactive")}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">{t("templates.noFieldGroups")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates.fields")}</CardTitle>
          <CardDescription>{t("templates.fieldsCount", { count: template.fields.length })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.fields.length ? (
            Array.from(groupedFields.entries()).map(([section, fields]) => (
              <div key={section}>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">
                    {section === "__default__" ? t("templates.section") : section}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t("templates.fieldsCount", { count: fields.length })}
                  </span>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("templates.fieldLabel")}</TableHead>
                        <TableHead>{t("templates.fieldName")}</TableHead>
                        <TableHead>{t("templates.fieldType")}</TableHead>
                        <TableHead>{t("templates.group")}</TableHead>
                        <TableHead>{t("templates.dataSource")}</TableHead>
                        <TableHead>{t("templates.required")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>{field.fieldLabelAr || field.fieldLabel}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{field.fieldName}</TableCell>
                            <TableCell>{field.fieldType}</TableCell>
                            <TableCell>{field.groupCode ?? "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground break-words">
                              {field.dataSource ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={field.isRequired ? "default" : "secondary"}>
                                {field.isRequired ? t("templates.statusActive") : t("templates.statusInactive")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("templates.noTemplateFields")}</p>
          )}
        </CardContent>
      </Card>

      {template.activityTimeline?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("templates.timeline.title")}</CardTitle>
            <CardDescription>{t("templates.timeline.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.activityTimeline.map((event, index) => (
              <div key={`${event.type}-${event.at}-${index}`} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{timelineLabels[event.type] ?? event.type}</p>
                  <Badge variant="outline">
                    {new Date(event.at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Badge>
                </div>
                {event.actorName ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("templates.timeline.by")}: {event.actorName}
                  </p>
                ) : null}
                {event.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {template.metadata && Object.keys(template.metadata).length ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("templates.jsonMetadata")}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[320px] overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(template.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("templates.publishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("templates.publishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
            {publishChecklist.map((item) => (
              <div key={`confirm-${item.key}`} className="flex items-center justify-between">
                <span>{item.label}</span>
                <Badge variant={item.ok ? "default" : "secondary"}>
                  {item.ok ? t("templates.checklist.ready") : t("templates.checklist.missing")}
                </Badge>
              </div>
            ))}
            <p className="text-muted-foreground">
              {checklistReadyCount}/{publishChecklist.length} {t("templates.checklist.readyCount")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPublish}
              disabled={isPublishing || !isChecklistReady}
            >
              {isPublishing ? t("templates.publishPending") : t("templates.publishAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

const PREVIEW_BASE_STYLES = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Tajawal", "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
}
.page {
  padding: 24px 32px;
}
h1, h2, h3 { margin: 0 0 12px; }
p { margin: 0 0 8px; }
table { width: 100%; border-collapse: collapse; }
td, th { padding: 6px 8px; border: 1px solid #e5e7eb; }
`

function buildPreviewHtml(html: string, css: string) {
  const trimmed = html.trim()
  const styleBlock = `${PREVIEW_BASE_STYLES}\n${css}`.trim()
  if (trimmed.includes("<html")) {
    if (trimmed.includes("</head>")) {
      return html.replace("</head>", `<style>${styleBlock}</style></head>`)
    }
    return `<style>${styleBlock}</style>${html}`
  }
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${styleBlock}</style>
  </head>
  <body>
    <div class="page">${html}</div>
  </body>
</html>`
}
