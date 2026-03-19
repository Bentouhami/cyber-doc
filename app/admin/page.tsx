import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminHomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Manage templates and employees.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Create and update contract templates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/templates">Open templates</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>Manage staff accounts and access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/employees">Open employees</Link>
            </Button>
          </CardContent>
        </Card>

      </section>
    </div>
  )
}
