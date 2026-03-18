import type { ReactNode } from "react";

import { RouteGuard } from "@/components/auth/route-guard";
import { AdminFooter } from "@/components/layout/admin-footer";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <RouteGuard allowRoles={["admin"]} redirectUnauthorizedTo="/" redirectTo="/documents">
        <main className="flex-1 bg-muted/10 py-6">
          <div className="container mx-auto px-4">{children}</div>
        </main>
      </RouteGuard>
      <AdminFooter />
    </div>
  );
}
