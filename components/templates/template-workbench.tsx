"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CheckCircle2, Circle, FileBadge2, FileText, Loader2 } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TemplatePicker } from "@/components/templates/template-picker"
import { TemplateForm, GenerationTemplate } from "@/components/templates/template-form"

type TemplateWorkbenchProps = {
  templates: GenerationTemplate[]
  initialTemplateId?: string
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

export function TemplateWorkbench({
  templates,
  initialTemplateId,
  initialValues,
  initialParticipants,
  initialParticipantIds,
  initialPayment,
  initialDocumentId,
  entryMode,
}: TemplateWorkbenchProps) {
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const [localTemplates, setLocalTemplates] = useState<GenerationTemplate[]>(templates)
  const [selectedId, setSelectedId] = useState<string | undefined>(initialTemplateId ?? templates[0]?.id)
  const [currentStep, setCurrentStep] = useState(initialDocumentId ? 2 : 1)
  const [isCreateDraftOpen, setIsCreateDraftOpen] = useState(false)
  const [isImportDraftOpen, setIsImportDraftOpen] = useState(false)
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false)
  const [isSubmittingImport, setIsSubmittingImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [draftForm, setDraftForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    documentTypeName: "CUSTOM_REQUEST",
    documentTypeNameAr: "طلب خاص",
    categoryName: "custom_client_request",
    categoryNameAr: "طلب عميل خاص",
  })
  const [importForm, setImportForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    documentTypeName: "CUSTOM_REQUEST",
    documentTypeNameAr: "طلب خاص",
    categoryName: "custom_client_request",
    categoryNameAr: "طلب عميل خاص",
  })
  const steps = useMemo(
    () => [
      { id: 1, label: t("templates.steps.selectTemplate") },
      { id: 2, label: t("templates.steps.fillForm") },
    ],
    [t],
  )

  const selectedTemplate = useMemo(
    () => localTemplates.find((template) => template.id === selectedId) ?? null,
    [localTemplates, selectedId],
  )

  const appendRequestedTemplate = (payload: { id: string; slug: string; title: string; titleAr?: string }) => {
    const createdTemplate: GenerationTemplate = {
      id: payload.id,
      slug: payload.slug,
      title: payload.title,
      titleAr: payload.titleAr ?? null,
      locale: "ar-MA",
      basePrice: null,
      participantRoles: [
        {
          roleKey: "client",
          roleLabel: "Client",
          roleLabelAr: "الزبون",
        },
      ],
      fields: [
        {
          id: `${payload.id}-client-full-name`,
          name: "client.fullName",
          label: "Nom complet",
          labelAr: "الاسم الكامل",
          type: "TEXT",
          isRequired: true,
          allowMultiple: false,
          section: "Client",
          options: null,
          helpText: null,
          helpTextAr: null,
          dataSource: "personas.client.fullName",
          participantRoleKey: "client",
        },
        {
          id: `${payload.id}-client-national-id`,
          name: "client.nationalId",
          label: "CIN",
          labelAr: "رقم البطاقة الوطنية",
          type: "TEXT",
          isRequired: false,
          allowMultiple: false,
          section: "Client",
          options: null,
          helpText: null,
          helpTextAr: null,
          dataSource: "personas.client.nationalId",
          participantRoleKey: "client",
        },
        {
          id: `${payload.id}-client-phone`,
          name: "client.phone",
          label: "Téléphone",
          labelAr: "الهاتف",
          type: "PHONE",
          isRequired: false,
          allowMultiple: false,
          section: "Client",
          options: null,
          helpText: null,
          helpTextAr: null,
          dataSource: "personas.client.phone",
          participantRoleKey: "client",
        },
      ],
    }

    setLocalTemplates((prev) => [createdTemplate, ...prev])
    setSelectedId(createdTemplate.id)
    setCurrentStep(2)
  }

  const handleCreateDraft = async () => {
    setIsSubmittingDraft(true)
    try {
      const response = await fetch("/api/templates/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftForm.title.trim(),
          titleAr: draftForm.titleAr.trim() || undefined,
          description: draftForm.description.trim() || undefined,
          documentType: {
            name: draftForm.documentTypeName.trim(),
            nameAr: draftForm.documentTypeNameAr.trim() || undefined,
          },
          category: {
            name: draftForm.categoryName.trim(),
            nameAr: draftForm.categoryNameAr.trim() || undefined,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Template request failed")
      }

      const data = await response.json()
      appendRequestedTemplate({
        id: data.templateId,
        slug: data.slug,
        title: draftForm.title.trim(),
        titleAr: draftForm.titleAr.trim() || undefined,
      })
      setIsCreateDraftOpen(false)
      toast({ title: t("templates.gap.requestSuccess") })
    } catch (error) {
      toast({
        title: t("templates.gap.requestError"),
        description: error instanceof Error ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingDraft(false)
    }
  }

  const handleImportDraft = async () => {
    if (!importFile) {
      toast({
        title: t("templates.gap.importError"),
        description: t("templates.gap.fileRequired"),
        variant: "destructive",
      })
      return
    }

    setIsSubmittingImport(true)
    try {
      const formData = new FormData()
      formData.set("file", importFile)
      formData.set(
        "meta",
        JSON.stringify({
          title: importForm.title.trim(),
          titleAr: importForm.titleAr.trim() || undefined,
          description: importForm.description.trim() || undefined,
          documentTypeName: importForm.documentTypeName.trim(),
          documentTypeNameAr: importForm.documentTypeNameAr.trim() || undefined,
          categoryName: importForm.categoryName.trim(),
          categoryNameAr: importForm.categoryNameAr.trim() || undefined,
        }),
      )

      const response = await fetch("/api/templates/requests/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Import failed")
      }

      const data = await response.json()
      appendRequestedTemplate({
        id: data.templateId,
        slug: data.slug,
        title: importForm.title.trim(),
        titleAr: importForm.titleAr.trim() || undefined,
      })
      setIsImportDraftOpen(false)
      setImportFile(null)
      toast({ title: t("templates.gap.importSuccess") })
    } catch (error) {
      toast({
        title: t("templates.gap.importError"),
        description: error instanceof Error ? error.message : "Import failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingImport(false)
    }
  }

  if (!localTemplates.length) {
    return (
      <Card dir={dir} className="border-dashed">
        <CardHeader>
          <CardTitle>{t("templates.title")}</CardTitle>
          <CardDescription>{t("templates.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("templates.noTemplatesAvailable")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("templates.noTemplatesHint")}{" "}
            <Link href="/admin/templates" className="text-primary underline">
              {t("templates.noTemplatesCta")}
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card className="border-border/80">
        <CardContent className="space-y-5 py-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{t("templates.steps.title")}</p>
            <p className="text-xs text-muted-foreground">{t("templates.steps.subtitle")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {steps.map((step) => {
              const isActive = step.id === currentStep
              const isDone = step.id < currentStep
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    isActive
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border/80 bg-background text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : isActive ? (
                    <FileBadge2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="font-medium">{`${step.id}. ${step.label}`}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("templates.title")}
          </CardTitle>
          <CardDescription>{t("templates.formInstructions")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TemplatePicker
            templates={localTemplates}
            value={selectedId}
            onChange={setSelectedId}
            disabled={Boolean(initialDocumentId)}
            onRequestCreateDraft={(query) => {
              setDraftForm((prev) => ({ ...prev, title: query, titleAr: prev.titleAr || query }))
              setIsCreateDraftOpen(true)
            }}
            onRequestImportWord={(query) => {
              setImportForm((prev) => ({ ...prev, title: query, titleAr: prev.titleAr || query }))
              setIsImportDraftOpen(true)
            }}
          />
          {selectedTemplate ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">{t("templates.locale")}:</span> {selectedTemplate.locale.toUpperCase()}
              </p>
              <p>
                <span className="font-medium">{t("templates.fieldsCount", { count: selectedTemplate.fields.length })}</span>
              </p>
              <p>
                <span className="font-medium">{t("templates.basePrice")}:</span>{" "}
                {selectedTemplate.basePrice ? selectedTemplate.basePrice : "—"}
              </p>
              {initialDocumentId ? (
                <p className="text-xs text-muted-foreground">{t("templates.editModeHint")}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedTemplate || currentStep === 2}
            >
              {t("templates.steps.nextAction")}
            </Button>
          </div>
        </div>
      </Card>

      {selectedTemplate ? (
        currentStep === 2 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{t("templates.steps.fillFormTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("templates.steps.fillFormDescription")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                {t("templates.steps.backAction")}
              </Button>
            </div>
            <TemplateForm
              key={selectedTemplate.id}
              template={selectedTemplate}
              initialValues={selectedTemplate.id === initialTemplateId ? initialValues : undefined}
              initialParticipants={
                initialTemplateId
                  ? selectedTemplate.id === initialTemplateId
                    ? initialParticipants
                    : undefined
                  : initialParticipants
              }
              initialParticipantIds={
                initialTemplateId
                  ? selectedTemplate.id === initialTemplateId
                    ? initialParticipantIds
                    : undefined
                  : initialParticipantIds
              }
              initialPayment={selectedTemplate.id === initialTemplateId ? initialPayment : undefined}
              initialDocumentId={selectedTemplate.id === initialTemplateId ? initialDocumentId : undefined}
              entryMode={entryMode}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("templates.steps.readyForDetails")}
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("templates.selectTemplatePlaceholder")}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDraftOpen} onOpenChange={setIsCreateDraftOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("templates.gap.createDraftTitle")}</DialogTitle>
            <DialogDescription>{t("templates.gap.createDraftDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("templates.title")}
              value={draftForm.title}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              placeholder={t("templates.titleAr")}
              value={draftForm.titleAr}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, titleAr: event.target.value }))}
            />
            <Textarea
              placeholder={t("templates.description")}
              value={draftForm.description}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("templates.documentType")}
                value={draftForm.documentTypeName}
                onChange={(event) => setDraftForm((prev) => ({ ...prev, documentTypeName: event.target.value }))}
              />
              <Input
                placeholder={t("templates.documentType")}
                value={draftForm.documentTypeNameAr}
                onChange={(event) => setDraftForm((prev) => ({ ...prev, documentTypeNameAr: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("templates.category")}
                value={draftForm.categoryName}
                onChange={(event) => setDraftForm((prev) => ({ ...prev, categoryName: event.target.value }))}
              />
              <Input
                placeholder={t("templates.category")}
                value={draftForm.categoryNameAr}
                onChange={(event) => setDraftForm((prev) => ({ ...prev, categoryNameAr: event.target.value }))}
              />
            </div>
            <Button
              onClick={handleCreateDraft}
              disabled={isSubmittingDraft || !draftForm.title.trim()}
              className="w-full"
            >
              {isSubmittingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("templates.gap.createDraft")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDraftOpen} onOpenChange={setIsImportDraftOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("templates.gap.importWordTitle")}</DialogTitle>
            <DialogDescription>{t("templates.gap.importWordDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("templates.title")}
              value={importForm.title}
              onChange={(event) => setImportForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              placeholder={t("templates.titleAr")}
              value={importForm.titleAr}
              onChange={(event) => setImportForm((prev) => ({ ...prev, titleAr: event.target.value }))}
            />
            <Textarea
              placeholder={t("templates.description")}
              value={importForm.description}
              onChange={(event) => setImportForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("templates.documentType")}
                value={importForm.documentTypeName}
                onChange={(event) => setImportForm((prev) => ({ ...prev, documentTypeName: event.target.value }))}
              />
              <Input
                placeholder={t("templates.documentType")}
                value={importForm.documentTypeNameAr}
                onChange={(event) => setImportForm((prev) => ({ ...prev, documentTypeNameAr: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("templates.category")}
                value={importForm.categoryName}
                onChange={(event) => setImportForm((prev) => ({ ...prev, categoryName: event.target.value }))}
              />
              <Input
                placeholder={t("templates.category")}
                value={importForm.categoryNameAr}
                onChange={(event) => setImportForm((prev) => ({ ...prev, categoryNameAr: event.target.value }))}
              />
            </div>
            <Input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
            />
            <Button
              onClick={handleImportDraft}
              disabled={isSubmittingImport || !importForm.title.trim()}
              className="w-full"
            >
              {isSubmittingImport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("templates.gap.importWord")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
