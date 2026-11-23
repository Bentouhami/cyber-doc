"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLocale();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t(isDark ? "theme.light" : "theme.dark")}
      title={t(isDark ? "theme.light" : "theme.dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
