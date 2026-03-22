"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { LogOut, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/components/providers/user-profile-provider";
import { useLocale } from "@/hooks/use-locale";
import { signOut } from "@/lib/auth-client";
import { translateRoleName } from "@/utils/roles";

const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher").then((mod) => mod.LanguageSwitcher),
  { ssr: false },
);

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  { ssr: false },
);

export function AdminHeader() {
  const { t, dir } = useLocale();
  const { user } = useUserProfile();

  const initials =
    user?.displayName
      ?.split(" ")
      .map((segment) => segment[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "C";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      dir={dir}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5" />
            <span>{t("navigation.brand")}</span>
          </Link>
          <span className="hidden rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            {t("roles.labels.admin")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{t("user.greeting", { name: user.displayName })}</p>
                <p className="text-xs text-muted-foreground">
                  {user.roles.length
                    ? user.roles.map((role) => translateRoleName(role.name, t)).join(" • ")
                    : t("employees.noRole")}
                </p>
              </div>
              <Avatar className="border">
                <AvatarImage src={user.image ?? undefined} alt={user.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{t("user.menu.logout")}</span>
              </Button>
            </div>
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
