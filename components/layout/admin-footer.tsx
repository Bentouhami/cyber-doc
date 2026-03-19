"use client";

import { useLocale } from "@/hooks/use-locale";

export function AdminFooter() {
  const { t, dir } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20 py-4" dir={dir}>
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        {t("footer.admin", { year })}
      </div>
    </footer>
  );
}
