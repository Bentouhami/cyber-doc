"use client";

import { useLocale } from "@/hooks/use-locale";

export function DocumentCreateHeader({ isVersion }: { isVersion: boolean }) {
  const { t, dir } = useLocale();

  return (
    <header className="rounded-2xl border bg-card p-6 shadow-sm" dir={dir}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          CyberDoc
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(isVersion ? "documents.create.versionTitle" : "documents.create.title")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("documents.create.description")}
        </p>
      </div>
    </header>
  );
}
