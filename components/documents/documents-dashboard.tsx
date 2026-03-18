"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { useLocale } from "@/hooks/use-locale"
import { Button } from "@/components/ui/button"
import { DocumentsTable, type DocumentTableRow } from "@/components/documents/documents-table"
import { DocumentCards } from "@/components/documents/document-cards"

type StatusOption = {
  id: number
  name: string
  nameAr?: string | null
}

type TemplateOption = {
  id: string
  title: string
  titleAr?: string | null
}

type CreatorOption = {
  id: string
  label: string
  email?: string | null
}

export function DocumentsDashboard() {
  const { t } = useLocale()
  const [documents, setDocuments] = useState<DocumentTableRow[]>([])
  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [creators, setCreators] = useState<CreatorOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    template: "all",
    dateFrom: "",
    dateTo: "",
    createdBy: "all",
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const query = new URLSearchParams()
        query.set("page", String(page))
        query.set("pageSize", String(pageSize))
        if (appliedFilters.search.trim()) {
          query.set("q", appliedFilters.search.trim())
        }
        if (appliedFilters.status !== "all") {
          query.set("statusId", appliedFilters.status)
        }
        if (appliedFilters.template !== "all") {
          query.set("templateId", appliedFilters.template)
        }
        if (appliedFilters.createdBy && appliedFilters.createdBy !== "all") {
          query.set("createdById", appliedFilters.createdBy)
        }
        if (appliedFilters.dateFrom) {
          query.set("from", appliedFilters.dateFrom)
        }
        if (appliedFilters.dateTo) {
          query.set("to", appliedFilters.dateTo)
        }

        const [docsRes, statusesRes, templatesRes] = await Promise.all([
          fetch(`/api/documents?${query.toString()}`),
          fetch("/api/document-statuses"),
          fetch("/api/templates?active=false"),
        ])

        if (!docsRes.ok || !statusesRes.ok || !templatesRes.ok) {
          throw new Error("Failed to load documents")
        }

        const [docsPayload, statusesData, templatesData] = await Promise.all([
          docsRes.json(),
          statusesRes.json(),
          templatesRes.json(),
        ])

        setDocuments(docsPayload.data ?? [])
        setTotalPages(docsPayload.totalPages ?? 1)
        setTotalDocuments(docsPayload.total ?? 0)
        setStatuses(statusesData)
        setTemplates(
          templatesData.map((template: any) => ({
            id: template.id,
            title: template.title,
            titleAr: template.titleAr ?? null,
          })),
        )
      } catch (error) {
        console.error("Documents load failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [page, pageSize, appliedFilters])

  useEffect(() => {
    const loadCreators = async () => {
      try {
        const response = await fetch("/api/document-creators?limit=100")
        if (!response.ok) {
          throw new Error("Failed to load creators")
        }
        const data = await response.json()
        setCreators(
          data.map((creator: any) => ({
            id: creator.id,
            label: creator.label,
            email: creator.email ?? null,
          })),
        )
      } catch (error) {
        console.error("Creators load failed:", error)
      }
    }

    loadCreators()
  }, [])

  const statusOptions = useMemo(
    () =>
      statuses.map((status) => ({
        value: String(status.id),
        label: status.nameAr || status.name,
      })),
    [statuses],
  )

  const templateOptions = useMemo(
    () =>
      templates.map((template) => ({
        value: template.id,
        label: template.titleAr || template.title,
      })),
    [templates],
  )

  const creatorOptions = useMemo(
    () =>
      creators.map((creator) => ({
        value: creator.id,
        label: creator.label || creator.email || creator.id,
      })),
    [creators],
  )

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 py-10">
        <div className="text-sm text-muted-foreground">{t("documents.loading")}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("documents.title")}</h1>
          <p className="text-muted-foreground">{t("documents.subtitle")}</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/documents/create">{t("documents.newDocument")}</Link>
        </Button>
      </div>

      <DocumentCards data={documents} />

      <DocumentsTable
        data={documents}
        statusOptions={statusOptions}
        templateOptions={templateOptions}
        creatorOptions={creatorOptions}
        filters={filters}
        total={totalDocuments}
        onFiltersChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onApplyFilters={() => {
          setAppliedFilters(filters)
          setPage(1)
        }}
        onResetFilters={() => {
          const reset = {
            search: "",
            status: "all",
            template: "all",
            dateFrom: "",
            dateTo: "",
            createdBy: "",
          }
          setFilters(reset)
          setAppliedFilters(reset)
          setPage(1)
        }}
      />
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page <= 1}>
          {t("documents.pagination.previous")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("documents.pagination.page", { page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page >= totalPages}
        >
          {t("documents.pagination.next")}
        </Button>
      </div>
    </div>
  )
}
