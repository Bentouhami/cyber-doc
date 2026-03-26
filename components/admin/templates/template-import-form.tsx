"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
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
        throw new Error(data.message || tt("templates.importFailedGeneric", "Échec de l'import"))
      }

      toast({ title: t("templates.importSuccess") })
      if (data.slug) {
        window.location.href = `/admin/templates/${data.slug}`
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
        throw new Error(data.message || tt("templates.importFailedGeneric", "Échec de l'import"))
      }

      toast({ title: t("templates.gap.importSuccess") })
      if (data.slug) {
        window.location.href = `/admin/templates/${data.slug}`
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
    <Card dir={dir}>
      <CardHeader>
        <CardTitle>{t("templates.importTitle")}</CardTitle>
        <CardDescription>{t("templates.importDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={(value) => setMode(value as "json" | "word")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json">{tt("templates.importModeJson", "Import JSON")}</TabsTrigger>
            <TabsTrigger value="word">{tt("templates.importModeWord", "Import Word (.docx)")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "json" ? (
          <>
            <Textarea
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              className="min-h-[360px] font-mono text-xs"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleJsonImport} disabled={isSubmitting}>
                {isSubmitting ? t("templates.importPending") : t("templates.importAction")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayloadText(JSON.stringify(SAMPLE_PAYLOAD, null, 2))}
                disabled={isSubmitting}
              >
                {t("templates.importReset")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(payloadText)
                    setPayloadText(JSON.stringify(parsed, null, 2))
                  } catch {
                    toast({
                      title: t("templates.importError"),
                      description: tt("templates.importInvalidJson", "JSON invalide."),
                      variant: "destructive",
                    })
                  }
                }}
                disabled={isSubmitting}
              >
                {tt("templates.importFormat", "Formatter JSON")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{tt("templates.titleFr", "Titre (FR)")}</Label>
                <Input
                  value={wordMeta.title}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder={tt("templates.titleFr", "Titre (FR)")}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("templates.titleAr")}</Label>
                <Input
                  value={wordMeta.titleAr}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, titleAr: event.target.value }))}
                  placeholder={t("templates.titleAr")}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t("templates.description")}</Label>
                <Textarea
                  value={wordMeta.description}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t("templates.description")}
                />
              </div>
              <div className="space-y-1">
                <Label>{tt("templates.documentTypeFr", "Type de document (FR)")}</Label>
                <Input
                  value={wordMeta.documentTypeName}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, documentTypeName: event.target.value }))}
                  placeholder={tt("templates.documentTypeFr", "Type de document (FR)")}
                />
              </div>
              <div className="space-y-1">
                <Label>{tt("templates.documentTypeAr", "Type de document (AR)")}</Label>
                <Input
                  value={wordMeta.documentTypeNameAr}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, documentTypeNameAr: event.target.value }))}
                  placeholder={tt("templates.documentTypeAr", "Type de document (AR)")}
                />
              </div>
              <div className="space-y-1">
                <Label>{tt("templates.categoryFr", "Catégorie (FR)")}</Label>
                <Input
                  value={wordMeta.categoryName}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, categoryName: event.target.value }))}
                  placeholder={tt("templates.categoryFr", "Catégorie (FR)")}
                />
              </div>
              <div className="space-y-1">
                <Label>{tt("templates.categoryAr", "Catégorie (AR)")}</Label>
                <Input
                  value={wordMeta.categoryNameAr}
                  onChange={(event) => setWordMeta((prev) => ({ ...prev, categoryNameAr: event.target.value }))}
                  placeholder={tt("templates.categoryAr", "Catégorie (AR)")}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{tt("templates.importWordFile", "Fichier Word (.docx)")}</Label>
                <Input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setWordFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-muted-foreground text-xs">
                  {tt("templates.importWordHint", "Le fichier sera importé en brouillon pour révision avant publication.")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleWordImport} disabled={isSubmitting || !isWordReady}>
                {isSubmitting ? t("templates.importPending") : tt("templates.importWordAction", "Importer le Word")}
              </Button>
            </div>
          </>
        )}
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
    </Card>
  )
}
