"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "cyberdoc_lang";

export function useLocale() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language ?? "fr";

  const dir = useMemo(() => i18n.dir(language), [i18n, language]);
  const isRTL = dir === "rtl";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [dir, language]);

  const setLanguage = useCallback(
    async (nextLanguage: string) => {
      if (!nextLanguage || nextLanguage === language) {
        return;
      }

      await i18n.changeLanguage(nextLanguage);
    },
    [i18n, language],
  );

  return {
    language,
    dir,
    isRTL,
    setLanguage,
    t,
    i18n,
  };
}

export function useLanguageOptions() {
  const { t } = useTranslation();

  return [
    { value: "fr", label: t("language.french") },
    { value: "ar", label: t("language.arabic") },
  ];
}

export const LOCALE_STORAGE_KEY = STORAGE_KEY;
