"use client"

import Link from "next/link"
import { FileClock, LayoutDashboard, Layers, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/hooks/use-locale"

export default function AdminHomePage() {
  const { t } = useLocale()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-900 via-sky-900 to-teal-800 p-6 text-white shadow-lg shadow-slate-900/15 dark:from-slate-800 dark:via-sky-900 dark:to-teal-900">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
          <LayoutDashboard className="h-3.5 w-3.5" />
          {t("adminHome.badge")}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("adminHome.title")}</h1>
        <p className="mt-1 text-sm text-white/80">{t("adminHome.subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle>{t("adminHome.templatesTitle")}</CardTitle>
            <CardDescription>{t("adminHome.templatesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/templates">{t("adminHome.templatesAction")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle>{t("adminHome.employeesTitle")}</CardTitle>
            <CardDescription>{t("adminHome.employeesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/employees">{t("adminHome.employeesAction")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileClock className="h-5 w-5" />
            </div>
            <CardTitle>{t("adminHome.requestsTitle")}</CardTitle>
            <CardDescription>{t("adminHome.requestsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/templates/requests">{t("adminHome.requestsAction")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
