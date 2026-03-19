"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Download, Edit3, Eye } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export type DocumentTableRow = {
  id: string
  templateId: string
  templateTitle: string
  templateCategory?: string | null
  statusId: number
  statusName: string
  statusColor?: string | null
  createdAt: string
  createdByName: string
  chargedTotal?: string | null
  currency: string
  totalCopies: number
  filePath?: string | null
}

type FilterOption = {
  value: string
  label: string
}

type DocumentsTableProps = {
  data: DocumentTableRow[]
  statusOptions: FilterOption[]
  templateOptions: FilterOption[]
  creatorOptions: FilterOption[]
  filters: {
    search: string
    status: string
    template: string
    dateFrom: string
    dateTo: string
    createdBy: string
  }
  total: number
  onFiltersChange: (next: Partial<DocumentsTableProps["filters"]>) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export function DocumentsTable({
  data,
  statusOptions,
  templateOptions,
  creatorOptions,
  filters,
  total,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}: DocumentsTableProps) {
  const { t, dir } = useLocale()
  const { toast } = useToast()
  const router = useRouter()
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const renderStatusBadge = (row: DocumentTableRow) => {
    const color = row.statusColor ?? "#64748B"
    return (
      <Badge
        style={{
          backgroundColor: `${color}20`,
          color,
          borderColor: color,
        }}
      >
        {row.statusName}
      </Badge>
    )
  }

  const formatAmount = (row: DocumentTableRow) => {
    if (!row.chargedTotal) return "—"
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: row.currency || "MAD",
      minimumFractionDigits: 2,
    })
    return formatter.format(Number(row.chargedTotal))
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("documents.searchLabel")}</label>
          <Input
            placeholder={t("documents.searchPlaceholder")}
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("documents.statusFilter")}</label>
          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("documents.statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all") ?? "Tous"}</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("documents.templateFilter")}</label>
          <Select value={filters.template} onValueChange={(value) => onFiltersChange({ template: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("documents.templateFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all") ?? "Tous"}</SelectItem>
              {templateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("documents.creatorFilter")}</label>
          <Select value={filters.createdBy} onValueChange={(value) => onFiltersChange({ createdBy: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("documents.creatorFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all") ?? "Tous"}</SelectItem>
              {creatorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("documents.dateFrom")}</label>
            <Input type="date" value={filters.dateFrom} onChange={(event) => onFiltersChange({ dateFrom: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("documents.dateTo")}</label>
            <Input type="date" value={filters.dateTo} onChange={(event) => onFiltersChange({ dateTo: event.target.value })} />
          </div>
        </div>
        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-5">
          <Button variant="default" onClick={onApplyFilters}>
            {t("documents.applyFilters")}
          </Button>
          <Button variant="outline" onClick={onResetFilters}>
            {t("documents.resetFilters")}
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            {data.length}/{total}
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("documents.table.createdAt")}</TableHead>
              <TableHead>{t("documents.table.template")}</TableHead>
              <TableHead>{t("documents.table.status")}</TableHead>
              <TableHead>{t("documents.table.createdBy")}</TableHead>
              <TableHead>{t("documents.table.amount")}</TableHead>
              <TableHead>{t("documents.table.copies")}</TableHead>
              <TableHead className="text-right">{t("documents.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.templateTitle}</span>
                      {row.templateCategory ? (
                        <span className="text-xs text-muted-foreground">{row.templateCategory}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(row)}</TableCell>
                  <TableCell>{row.createdByName}</TableCell>
                  <TableCell>{formatAmount(row)}</TableCell>
                  <TableCell>{row.totalCopies}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/documents/create?documentId=${row.id}`}>
                          <Edit3 className="mr-1 h-4 w-4" />
                          {t("documents.actions.edit")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                                  const parsed = JSON.parse(text)
                                  message = parsed.message || message
                                }
                              } catch (parseError) {
                                console.error("Duplicate error payload:", parseError)
                              }
                              throw new Error(message)
                            }
                            const payload = await response.json()
                            toast({ title: t("documents.actions.duplicateSuccess") })
                            router.push(`/documents/${payload.documentId}`)
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
                        <Copy className="mr-1 h-4 w-4" />
                        {t("documents.actions.duplicate")}
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/documents/${row.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          {t("documents.viewDetails")}
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={!row.filePath}
                        asChild={Boolean(row.filePath)}
                      >
                        {row.filePath ? (
                          <Link href={`/api/documents/${row.id}/download`} target="_blank">
                            <Download className="mr-1 h-4 w-4" />
                            {t("templates.downloadAction")}
                          </Link>
                        ) : (
                          <>
                            <Download className="mr-1 h-4 w-4" />
                            {t("templates.downloadAction")}
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("documents.noDocuments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
