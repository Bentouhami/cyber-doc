import type { ReactNode } from "react";

import { RouteGuard } from "@/components/auth/route-guard";
import { AdminFooter } from "@/components/layout/admin-footer";
import { AdminHeader } from "@/components/layout/admin-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-background to-slate-100/70 dark:from-slate-950 dark:via-background dark:to-slate-900">
      <AdminHeader />
      <RouteGuard allowRoles={["admin"]} redirectUnauthorizedTo="/" redirectTo="/documents">
        <main className="flex-1 py-6">
          <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 sm:px-6 lg:px-8">
            <AppSidebar variant="admin" />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      </RouteGuard>
      <AdminFooter />
    </div>
  );
}
