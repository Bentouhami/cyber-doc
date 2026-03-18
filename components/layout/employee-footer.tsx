"use client";

import { useLocale } from "@/hooks/use-locale";

export function EmployeeFooter() {
  const { t, dir } = useLocale();

  return (
    <footer className="border-t bg-muted/10 py-6" dir={dir}>
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">{t("footer.employee")}</div>
    </footer>
  );
}
