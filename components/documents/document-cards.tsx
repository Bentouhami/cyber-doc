"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Copy, Edit3, Eye } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DocumentTableRow } from "@/components/documents/documents-table"

type DocumentCardsProps = {
  data: DocumentTableRow[]
}

function formatAmount(row: DocumentTableRow) {
  if (!row.chargedTotal) return "—"
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: row.currency || "MAD",
      minimumFractionDigits: 2,
    }).format(Number(row.chargedTotal))
  } catch {
    return `${row.chargedTotal} ${row.currency || ""}`.trim()
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function DocumentCards({ data }: DocumentCardsProps) {
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const router = useRouter()
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  if (!data.length) {
    return (
      <Card dir={dir}>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="space-y-2">
            <p className="text-lg font-semibold">{t("documents.cards.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("documents.cards.emptySubtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/documents/create">{t("documents.newDocument")}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const recentDocuments = data.slice(0, 6)

  return (
    <section className="space-y-4" dir={dir}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("documents.cards.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("documents.cards.subtitle")}</p>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentDocuments.map((row) => (
            <Card key={row.id} className="flex flex-col border-border/70 shadow-sm transition hover:border-primary/30">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg leading-tight">{row.templateTitle}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {row.templateCategory ?? t("documents.cards.uncategorized")}
                    </p>
                  </div>
                  <Badge style={{ backgroundColor: `${row.statusColor ?? "#64748B"}20`, color: row.statusColor ?? "#64748B" }}>
                    {row.statusName}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t("documents.cards.createdBy")}</span>
                  <span className="font-medium text-foreground">{row.createdByName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("documents.cards.amount")}</span>
                  <span className="font-medium text-foreground">{formatAmount(row)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("documents.cards.copies")}</span>
                  <span className="font-medium text-foreground">{row.totalCopies}</span>
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between border-t pt-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("documents.cards.reference", { id: row.id.slice(0, 8) })}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={t("documents.actions.edit")} asChild>
                        <Link href={`/documents/create?documentId=${row.id}`}>
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("documents.actions.edit")}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("documents.actions.duplicate")}
                        disabled={duplicatingId === row.id}
                        onClick={async () => {
                          setDuplicatingId(row.id)
                          try {
                            const response = await fetch(`/api/documents/${row.id}/duplicate`, {
                              method: "POST",
                            })
                            if (!response.ok) {
                              let message = "Duplicate failed"
                              try {
                                const text = await response.text()
                                if (text) {
                                  const data = JSON.parse(text)
                                  message = data.message || message
                                }
                              } catch (parseError) {
                                console.error("Duplicate error payload:", parseError)
                              }
                              throw new Error(message)
                            }
                            const data = await response.json()
                            toast({ title: t("documents.actions.duplicateSuccess") })
                            router.push(`/documents/${data.documentId}`)
                          } catch (error) {
                            toast({
                              title: t("documents.actions.duplicateError"),
                              description: error instanceof Error ? error.message : "Duplicate failed",
                              variant: "destructive",
                            })
                          } finally {
                            setDuplicatingId(null)
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("documents.actions.duplicate")}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" size="icon" aria-label={t("documents.actions.view")} asChild>
                        <Link href={`/documents/${row.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("documents.actions.view")}</TooltipContent>
                  </Tooltip>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </TooltipProvider>
    </section>
  )
}
