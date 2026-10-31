"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FileText, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { useUserProfile } from "@/components/providers/user-profile-provider";
import { signOut } from "@/lib/auth-client";

const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher").then((mod) => mod.LanguageSwitcher),
  { ssr: false },
);

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false },
);

export function EmployeeHeader() {
  const { t, dir } = useLocale();
  const { user } = useUserProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70" dir={dir}>
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FileText className="h-5 w-5" />
          <span suppressHydrationWarning>{t("navigation.brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline" suppressHydrationWarning>
                {t("user.greeting", { name: user.displayName })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  await signOut();
                }}
                aria-label={t("user.menu.logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">{t("user.menu.profile")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
