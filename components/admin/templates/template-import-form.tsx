"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Braces,
  FileText,
  FileUp,
  Info,
  Languages,
  Loader2,
  RotateCcw,
  Tags,
  Upload,
  WandSparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useLocale } from "@/hooks/use-locale"

const SAMPLE_PAYLOAD = {
  slug: "template-slug",
  title: "Template Title",
  titleAr: "عنوان القالب",
  description: "Short description",
  locale: "ar-MA",
  language: "ar",
  metadata: { basePrice: 25 },
  documentType: {
    name: "ATTESTATION",
    nameAr: "شهادة",
  },
  category: {
    name: "residence_attestation",
    nameAr: "إثبات السكن",
  },
  contentHtml: "<html><body><h1>{{declarant.fullName}}</h1></body></html>",
  contentCss: "body { font-family: Arial, sans-serif; }",
  pdfOptions: {
    format: "A4",
    margin: {
      top: "1cm",
      right: "1cm",
      bottom: "1cm",
      left: "1cm",
    },
  },
  participantRoles: [
    {
      roleKey: "declarant",
      roleLabel: "Declarant",
      roleLabelAr: "المصرّح",
      isRequired: true,
    },
  ],
  fields: [
    {
      fieldName: "declarant.fullName",
      fieldLabel: "Nom complet",
      fieldLabelAr: "الاسم الكامل",
      fieldType: "TEXT",
      isRequired: true,
    },
  ],
}

export function TemplateImportForm() {
  const router = useRouter()
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const requestedMode = searchParams.get("mode") === "word" ? "word" : "json"

  const [mode, setMode] = useState<"json" | "word">(requestedMode)
  const [payloadText, setPayloadText] = useState(JSON.stringify(SAMPLE_PAYLOAD, null, 2))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    Array<{ slug: string; title: string; updatedAt: string; reasons?: string[] }>
  >([])
  const [pendingJsonPayload, setPendingJsonPayload] = useState<Record<string, unknown> | null>(null)
  const [pendingDuplicateSource, setPendingDuplicateSource] = useState<"json" | "word" | null>(null)

  const [wordFile, setWordFile] = useState<File | null>(null)
  const [wordMeta, setWordMeta] = useState({
    title: "",
    titleAr: "",
    description: "",
    documentTypeName: "CUSTOM_REQUEST",
    documentTypeNameAr: "طلب خاص",
    categoryName: "custom_client_request",
    categoryNameAr: "طلب عميل خاص",
  })

  const tt = (key: string, fallback: string) => t(key, { defaultValue: fallback })

  const isWordReady = useMemo(
    () => !!wordFile && !!wordMeta.title.trim() && !!wordMeta.documentTypeName.trim() && !!wordMeta.categoryName.trim(),
    [wordFile, wordMeta.categoryName, wordMeta.documentTypeName, wordMeta.title],
  )

  const submitJsonImport = async (payload: Record<string, unknown>, forceDuplicateOverride = false) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, forceDuplicateOverride }),
      })

      const data = await response.json().catch(() => ({}))
      if (response.status === 409 && data?.code === "DUPLICATE_CANDIDATE") {
        setDuplicateCandidates(Array.isArray(data.candidates) ? data.candidates : [])
        setPendingJsonPayload(payload)
        setPendingDuplicateSource("json")
        setIsDuplicateDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error(tt("common.requestFailed", "La demande n’a pas pu être traitée."))
      }

      toast({ title: t("templates.importSuccess") })
      if (data.slug) {
        router.push(`/admin/templates/${data.slug}`)
      }
    } catch (error) {
      toast({
        title: t("templates.importError"),
        description: error instanceof Error ? error.message : tt("templates.importFailedGeneric", "Échec de l'import"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJsonImport = async () => {
    try {
      const payload = JSON.parse(payloadText) as Record<string, unknown>
      await submitJsonImport(payload, false)
    } catch (error) {
      toast({
        title: t("templates.importError"),
        description: error instanceof Error ? error.message : tt("templates.importFailedGeneric", "Échec de l'import"),
        variant: "destructive",
      })
    }
  }

  const submitWordImport = async (forceDuplicateOverride = false) => {
    if (!isWordReady || !wordFile) {
      toast({
        title: t("templates.importError"),
        description: tt("templates.importWordMissing", "Veuillez renseigner les champs requis et sélectionner un fichier .docx."),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("file", wordFile)
      formData.set("meta", JSON.stringify(wordMeta))
      formData.set("forceDuplicateOverride", forceDuplicateOverride ? "true" : "false")

      const response = await fetch("/api/templates/requests/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (response.status === 409 && data?.code === "DUPLICATE_CANDIDATE") {
        setDuplicateCandidates(Array.isArray(data.candidates) ? data.candidates : [])
        setPendingJsonPayload(null)
        setPendingDuplicateSource("word")
        setIsDuplicateDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error(tt("common.requestFailed", "La demande n’a pas pu être traitée."))
      }

      toast({ title: t("templates.gap.importSuccess") })
      if (data.slug) {
        router.push(`/admin/templates/${data.slug}`)
      }
    } catch (error) {
      toast({
        title: t("templates.gap.importError"),
        description: error instanceof Error ? error.message : tt("templates.importFailedGeneric", "Échec de l'import"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWordImport = async () => {
    await submitWordImport(false)
  }

  return (
    <div className="space-y-6" dir={dir}>
      <header className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-900 via-sky-900 to-teal-800 p-6 text-white shadow-lg shadow-slate-900/15 dark:from-slate-800 dark:via-sky-900 dark:to-teal-900">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          {t("templates.importBadge")}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("templates.importTitle")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">
          {t("templates.importDescription")}
        </p>
      </header>

      <Card className="border-border/70 shadow-sm" aria-busy={isSubmitting}>
        <CardHeader className="border-b border-border/70">
          <CardTitle>{t("templates.importModeTitle")}</CardTitle>
          <CardDescription>{t("templates.importModeDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "json" | "word")}>
            <TabsList className="grid h-auto min-h-12 w-full grid-cols-1 gap-1 p-1 sm:grid-cols-2">
              <TabsTrigger value="json" className="min-h-11 gap-2">
                <Braces className="h-4 w-4" aria-hidden />
                {t("templates.importModeJson")}
              </TabsTrigger>
              <TabsTrigger value="word" className="min-h-11 gap-2">
                <FileText className="h-4 w-4" aria-hidden />
                {t("templates.importModeWord")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "json" ? (
            <section className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Braces className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="font-semibold">{t("templates.importJsonLabel")}</h2>
                  <p id="template-json-hint" className="text-sm text-muted-foreground">
                    {t("templates.importJsonHint")}
                  </p>
                </div>
              </div>
              <Label htmlFor="template-json-payload" className="sr-only">
                {t("templates.importJsonLabel")}
              </Label>
              <Textarea
                id="template-json-payload"
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                aria-describedby="template-json-hint"
                spellCheck={false}
                className="min-h-[360px] bg-background font-mono text-xs leading-5"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="min-h-11" onClick={handleJsonImport} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                  {isSubmitting ? t("templates.importPending") : t("templates.importAction")}
                </Button>
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  onClick={() => setPayloadText(JSON.stringify(SAMPLE_PAYLOAD, null, 2))}
                  disabled={isSubmitting}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {t("templates.importReset")}
                </Button>
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(payloadText)
                      setPayloadText(JSON.stringify(parsed, null, 2))
                    } catch {
                      toast({
                        title: t("templates.importError"),
                        description: t("templates.importInvalidJson"),
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <WandSparkles className="h-4 w-4" aria-hidden />
                  {t("templates.importFormat")}
                </Button>
              </div>
            </section>
          ) : (
            <div className="space-y-5">
              <section className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Languages className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t("templates.importWordDetailsTitle")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("templates.importWordDetailsDescription")}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="word-title-fr">{t("templates.titleFr")}</Label>
                    <Input
                      id="word-title-fr"
                      className="h-11 bg-background"
                      value={wordMeta.title}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder={t("templates.titleFr")}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="word-title-ar">{t("templates.titleAr")}</Label>
                    <Input
                      id="word-title-ar"
                      className="h-11 bg-background"
                      value={wordMeta.titleAr}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, titleAr: event.target.value }))}
                      placeholder={t("templates.titleAr")}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="word-description">{t("templates.description")}</Label>
                    <Textarea
                      id="word-description"
                      className="min-h-24 bg-background"
                      value={wordMeta.description}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder={t("templates.description")}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Tags className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t("templates.importTaxonomyTitle")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("templates.importTaxonomyDescription")}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="word-type-fr">{t("templates.documentTypeFr")}</Label>
                    <Input
                      id="word-type-fr"
                      className="h-11 bg-background"
                      value={wordMeta.documentTypeName}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, documentTypeName: event.target.value }))}
                      placeholder={t("templates.documentTypeFr")}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="word-type-ar">{t("templates.documentTypeAr")}</Label>
                    <Input
                      id="word-type-ar"
                      className="h-11 bg-background"
                      value={wordMeta.documentTypeNameAr}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, documentTypeNameAr: event.target.value }))}
                      placeholder={t("templates.documentTypeAr")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="word-category-fr">{t("templates.categoryFr")}</Label>
                    <Input
                      id="word-category-fr"
                      className="h-11 bg-background"
                      value={wordMeta.categoryName}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, categoryName: event.target.value }))}
                      placeholder={t("templates.categoryFr")}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="word-category-ar">{t("templates.categoryAr")}</Label>
                    <Input
                      id="word-category-ar"
                      className="h-11 bg-background"
                      value={wordMeta.categoryNameAr}
                      onChange={(event) => setWordMeta((prev) => ({ ...prev, categoryNameAr: event.target.value }))}
                      placeholder={t("templates.categoryAr")}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-semibold">{t("templates.importSourceTitle")}</h2>
                    <p id="word-file-hint" className="text-sm text-muted-foreground">
                      {t("templates.importWordHint")}
                    </p>
                  </div>
                </div>
                <Label htmlFor="word-file">{t("templates.importWordFile")}</Label>
                <Input
                  id="word-file"
                  className="mt-1.5 h-11 cursor-pointer bg-background"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  aria-describedby="word-file-hint"
                  onChange={(event) => setWordFile(event.target.files?.[0] ?? null)}
                  required
                />
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 p-3 text-sm text-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
                  <span>{t("templates.importWordHint")}</span>
                </div>
              </section>

              <Button className="min-h-11" onClick={handleWordImport} disabled={isSubmitting || !isWordReady}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                {isSubmitting ? t("templates.importPending") : t("templates.importWordAction")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
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
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault()
                if (pendingDuplicateSource === "json" && pendingJsonPayload) {
                  setIsDuplicateDialogOpen(false)
                  await submitJsonImport(pendingJsonPayload, true)
                  return
                }
                if (pendingDuplicateSource === "word") {
                  setIsDuplicateDialogOpen(false)
                  await submitWordImport(true)
                  return
                }
                if (!pendingJsonPayload) {
                  setIsDuplicateDialogOpen(false)
                  return
                }
                setIsDuplicateDialogOpen(false)
              }}
            >
              {tt("templates.duplicateWarningOverride", "Continuer quand même")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
