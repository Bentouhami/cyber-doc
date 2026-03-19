"use client"

import Link from "next/link"
import { Fragment } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowUpRight, FolderKanban, Globe, Layers, Rows3, UploadCloud } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"

export type TemplateListItem = {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  description?: string | null
  locale: string
  version: number
  isActive: boolean
  hasHtml: boolean
  basePrice?: number | null
  createdAt: string
  updatedAt: string
  documentType: {
    name: string
    nameAr?: string | null
  }
  category: {
    name: string
    nameAr?: string | null
  }
  participantRoles: {
    roleKey: string
    roleLabel: string
    roleLabelAr?: string | null
    isRequired: boolean
    minParticipants: number
    maxParticipants?: number | null
  }[]
  fieldCount: number
  asset?: {
    fileName: string
    version: number | null
  } | null
}

type TemplateListProps = {
  templates: TemplateListItem[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const { t, dir } = useLocale()

  if (!templates.length) {
    return (
      <Card dir={dir}>
        <CardHeader>
          <CardTitle>{t("templates.title")}</CardTitle>
          <CardDescription>{t("templates.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("templates.empty")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("templates.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("templates.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/templates/new" className="inline-flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              {t("templates.createAction")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/templates/import" className="inline-flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              {t("templates.importAction")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="flex h-full flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  <span>{template.titleAr || template.title}</span>
                </CardTitle>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? t("templates.statusActive") : t("templates.statusInactive")}
                </Badge>
                {!template.hasHtml ? (
                  <Badge variant="destructive">{t("templates.missingHtml")}</Badge>
                ) : null}
              </div>
              <CardDescription className="leading-relaxed">
                {template.description || t("templates.description")}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {template.documentType.nameAr || template.documentType.name}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="inline-flex items-center gap-1">
                  <Rows3 className="h-3.5 w-3.5" />
                  {template.category.nameAr || template.category.name}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {template.locale.toUpperCase()} · v{template.version}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {t("templates.fieldsCount", { count: template.fieldCount })}
                  </Badge>
                  <Badge variant="outline">
                    {t("templates.participantCount", { count: template.participantRoles.length })}
                  </Badge>
                  {template.basePrice !== null && template.basePrice !== undefined ? (
                    <Badge variant="outline" className="font-normal">
                      {t("templates.basePrice")}: {template.basePrice} MAD
                    </Badge>
                  ) : null}
                  {template.asset ? (
                    <Badge variant="outline" className="font-normal">
                      {template.asset.fileName} · v{template.asset.version ?? template.version}
                    </Badge>
                  ) : null}
                </div>
                {template.participantRoles.length ? (
                  <div className="flex flex-wrap gap-2">
                    {template.participantRoles.map((role) => (
                      <Badge key={`${template.id}-${role.roleKey}`} variant="secondary" className="font-normal">
                        {role.roleLabelAr || role.roleLabel}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  <div>
                    {t("templates.updatedAt")}:{" "}
                    {new Date(template.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div>
                    {t("templates.createdAt")}:{" "}
                    {new Date(template.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-normal">
                  {t("templates.slug")}: {template.slug}
                </Badge>
                <Button asChild variant="outline">
                  <Link href={`/admin/templates/${template.slug}`} className="inline-flex items-center gap-2">
                    <span>{t("templates.viewDetails")}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
