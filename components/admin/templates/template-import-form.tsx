"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [payloadText, setPayloadText] = useState(JSON.stringify(SAMPLE_PAYLOAD, null, 2))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = JSON.parse(payloadText)
      const response = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Import failed")
      }

      toast({ title: t("templates.importSuccess") })
    } catch (error) {
      toast({
        title: t("templates.importError"),
        description: error instanceof Error ? error.message : "Import failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card dir={dir}>
      <CardHeader>
        <CardTitle>{t("templates.importTitle")}</CardTitle>
        <CardDescription>{t("templates.importDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
          className="min-h-[360px] font-mono text-xs"
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
        </div>
      </CardContent>
    </Card>
  )
}
