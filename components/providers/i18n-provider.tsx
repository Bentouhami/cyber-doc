"use client"

import type { PropsWithChildren } from "react"
import { useState } from "react"
import { I18nextProvider } from "react-i18next"

import { getI18nInstance } from "@/lib/i18n"

export function I18nProvider({ 
  children,
  initialLanguage
}: PropsWithChildren<{ initialLanguage: string }>) {
  const [i18n] = useState(() => getI18nInstance(initialLanguage))

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
