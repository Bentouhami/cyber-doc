"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { FileClock, FilePlus2, FileText, LayoutDashboard, Layers, Sparkles, UploadCloud, Users } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  variant: "admin" | "employee";
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function AppSidebar({ variant }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  const adminItems: NavItem[] = [
    { href: "/admin", label: t("navigation.admin.dashboard"), icon: LayoutDashboard },
    { href: "/admin/templates", label: t("templates.title"), icon: Layers },
    { href: "/admin/templates/requests", label: t("navigation.admin.templateRequests"), icon: FileClock },
    { href: "/admin/templates/new", label: t("templates.createTitle"), icon: FilePlus2 },
    { href: "/admin/templates/import", label: t("templates.importTitle"), icon: UploadCloud },
    { href: "/admin/employees", label: t("navigation.admin.employees"), icon: Users },
  ];

  const employeeItems: NavItem[] = [
    { href: "/documents", label: t("navigation.employee.documents"), icon: FileText },
    { href: "/documents/create", label: t("documents.newDocument"), icon: FilePlus2 },
  ];

  const items = variant === "admin" ? adminItems : employeeItems;
  const sectionTitle = variant === "admin" ? t("roles.labels.admin") : t("navigation.employee.documents");

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-background/70 p-4 backdrop-blur xl:block">
      <div className="sticky top-20 space-y-4">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-slate-900 via-sky-900 to-teal-800 p-4 text-white shadow-lg shadow-slate-900/15 dark:from-slate-800 dark:via-sky-900 dark:to-teal-900">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            CyberDoc
          </div>
          <h2 className="text-lg font-semibold">{sectionTitle}</h2>
        </div>

        <nav className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/admin" && item.href !== "/documents" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="line-clamp-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
