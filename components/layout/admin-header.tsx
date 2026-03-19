"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";

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

const navItems = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "navigation.admin.dashboard" },
  { href: "/admin/employees", icon: Users, labelKey: "navigation.admin.employees" },
];

export function AdminHeader() {
  const pathname = usePathname();
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
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      dir={dir}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5" />
            <span>{t("navigation.brand")}</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
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
