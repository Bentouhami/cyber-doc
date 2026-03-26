"use client";

import { useLocale } from "@/hooks/use-locale";

export function EmployeeFooter() {
  const { t, dir } = useLocale();

  return (
    <footer className="border-t border-border/70 bg-background/70 py-6 backdrop-blur" dir={dir}>
      <div className="mx-auto w-full max-w-[1440px] px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">{t("footer.employee")}</div>
    </footer>
  );
}
