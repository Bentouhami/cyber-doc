"use client"

import { useMemo, useState } from "react"
import { FilePlus2, Search, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import type { GenerationTemplate } from "@/components/templates/template-form"

type TemplatePickerProps = {
  templates: GenerationTemplate[]
  value?: string
  onChange: (templateId: string) => void
  disabled?: boolean
  onRequestCreateDraft?: (query: string) => void
  onRequestImportWord?: (query: string) => void
}

export function TemplatePicker({
  templates,
  value,
  onChange,
  disabled,
  onRequestCreateDraft,
  onRequestImportWord,
}: TemplatePickerProps) {
  const { t, dir } = useLocale()
  const [query, setQuery] = useState("")

  const selectOptions = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    const filtered = lowered
      ? templates.filter((template) => {
          const label = (template.titleAr || template.title).toLowerCase()
          return label.includes(lowered)
        })
      : templates
    return filtered.map((template) => ({
      id: template.id,
      label: template.titleAr || template.title,
    }))
  }, [templates, query])

  return (
    <div className="space-y-2" dir={dir}>
      <Label className="text-sm font-medium">{t("templates.selectTemplate")}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("templates.searchTemplate")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          className="pl-9"
        />
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={t("templates.selectTemplatePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {query.trim().length >= 2 && selectOptions.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">{t("templates.gap.noMatch")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRequestCreateDraft?.(query.trim())}
              disabled={disabled}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              {t("templates.gap.createDraft")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRequestImportWord?.(query.trim())}
              disabled={disabled}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t("templates.gap.importWord")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
