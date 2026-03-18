"use client"

import { Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguageOptions, useLocale } from "@/hooks/use-locale"

export function LanguageSwitcher() {
  const { language, isRTL, setLanguage, t } = useLocale()
  const options = useLanguageOptions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{t("language.label")}</span>
          <span className="sm:hidden uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => setLanguage(option.value)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
