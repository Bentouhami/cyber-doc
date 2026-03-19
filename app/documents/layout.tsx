import type { ReactNode } from "react"

import { RouteGuard } from "@/components/auth/route-guard"
import { EmployeeHeader } from "@/components/layout/employee-header"
import { EmployeeFooter } from "@/components/layout/employee-footer"

type DocumentsLayoutProps = {
  children: ReactNode
}

export default function DocumentsLayout({ children }: DocumentsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <EmployeeHeader />
      <RouteGuard allowRoles={["admin", "employee"]} redirectUnauthorizedTo="/" redirectTo="/documents">
        <main className="flex-1">
          {children}
        </main>
      </RouteGuard>
      <EmployeeFooter />
    </div>
  )
}
