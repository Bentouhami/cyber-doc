import type { i18n } from "i18next"
import i18next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import arTranslations from "@/locales/ar/common.json"
import frTranslations from "@/locales/fr/common.json"

const resources = {
  fr: {
    translation: frTranslations,
  },
  ar: {
    translation: arTranslations,
  },
}

const supportedLngs = Object.keys(resources)

export function getI18nInstance(lng?: string): i18n {
  const instance = i18next.createInstance()

  if (typeof window !== "undefined") {
    instance.use(LanguageDetector)
  }

  instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "fr",
    supportedLngs,
    interpolation: {
      escapeValue: false,
    },
    detection:
      typeof window !== "undefined"
        ? {
            order: ["cookie", "localStorage", "navigator", "htmlTag"],
            caches: ["cookie", "localStorage"],
            lookupCookie: "cyberdoc_lang",
            lookupLocalStorage: "cyberdoc_lang",
          }
        : undefined,
    react: {
      useSuspense: false,
    },
  })

  return instance
}

export const availableLocales = supportedLngs
