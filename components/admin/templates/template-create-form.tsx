"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLocale } from "@/hooks/use-locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TemplateCreateForm() {
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assets, setAssets] = useState<{ id: string; fileName: string; filePath: string }[]>([])
  const [form, setForm] = useState({
    slug: "",
    title: "",
    titleAr: "",
    description: "",
    locale: "ar-MA",
    documentType: "",
    documentTypeAr: "",
    category: "",
    categoryAr: "",
    assetId: "none",
    contentHtml: "",
    contentCss: "",
    basePrice: "",
    pageFormat: "A4",
    marginTop: "1cm",
    marginRight: "1cm",
    marginBottom: "1cm",
    marginLeft: "1cm",
  })

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

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

    loadAssets()
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(),
          title: form.title.trim(),
          titleAr: form.titleAr.trim() || null,
          description: form.description.trim() || null,
          locale: form.locale.trim(),
          documentType: {
            name: form.documentType.trim(),
            nameAr: form.documentTypeAr.trim() || null,
          },
          category: {
            name: form.category.trim(),
            nameAr: form.categoryAr.trim() || null,
          },
          assetId: form.assetId === "none" ? null : form.assetId || null,
          contentHtml: form.contentHtml.trim() || null,
          contentCss: form.contentCss.trim() || null,
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
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Create failed")
      }

      const data = await response.json()
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
      <CardHeader>
        <CardTitle>{t("templates.createTitle")}</CardTitle>
        <CardDescription>{t("templates.createDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder={t("templates.slug")} />
          <Input value={form.locale} onChange={(event) => update("locale", event.target.value)} placeholder={t("templates.locale")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={t("templates.title")} />
          <Input value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} placeholder={t("templates.titleAr")} />
        </div>
        <Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder={t("templates.description")} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.documentType} onChange={(event) => update("documentType", event.target.value)} placeholder={t("templates.documentType")} />
          <Input value={form.documentTypeAr} onChange={(event) => update("documentTypeAr", event.target.value)} placeholder={t("templates.documentType")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder={t("templates.category")} />
          <Input value={form.categoryAr} onChange={(event) => update("categoryAr", event.target.value)} placeholder={t("templates.category")} />
        </div>
        <Textarea
          value={form.contentHtml}
          onChange={(event) => update("contentHtml", event.target.value)}
          placeholder={t("templates.htmlTemplate")}
          className="min-h-[200px] font-mono text-xs"
        />
        <Input
          value={form.basePrice}
          onChange={(event) => update("basePrice", event.target.value)}
          placeholder={t("templates.basePrice")}
          type="number"
          inputMode="decimal"
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
              <Input
                value={form.marginTop}
                onChange={(event) => update("marginTop", event.target.value)}
                placeholder={t("templates.marginTop")}
              />
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
        <Select value={form.assetId} onValueChange={(value) => update("assetId", value)}>
          <SelectTrigger>
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
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("templates.createPending") : t("templates.createAction")}
        </Button>
      </CardContent>
    </Card>
  )
}
