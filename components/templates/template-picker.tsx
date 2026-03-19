"use client"

import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/hooks/use-locale"
import type { GenerationTemplate } from "@/components/templates/template-form"

type TemplatePickerProps = {
  templates: GenerationTemplate[]
  value?: string
  onChange: (templateId: string) => void
  disabled?: boolean
}

export function TemplatePicker({ templates, value, onChange, disabled }: TemplatePickerProps) {
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
      <Label>{t("templates.selectTemplate")}</Label>
      <Input
        placeholder={t("templates.searchTemplate")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled}
      />
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
    </div>
  )
}
