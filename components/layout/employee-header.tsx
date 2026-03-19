"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FileText, Home, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { useUserProfile } from "@/components/providers/user-profile-provider";
import { signOut } from "@/lib/auth-client";

const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher").then((mod) => mod.LanguageSwitcher),
  { ssr: false },
);

const navItems = [
  { href: "/", icon: Home, labelKey: "navigation.employee.home" },
  { href: "/documents", icon: FileText, labelKey: "navigation.employee.documents" },
  { href: "/profile", icon: User, labelKey: "navigation.employee.profile" },
];

export function EmployeeHeader() {
  const { t, dir } = useLocale();
  const { user } = useUserProfile();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" dir={dir}>
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FileText className="h-5 w-5" />
          <span suppressHydrationWarning>{t("navigation.brand")}</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
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
