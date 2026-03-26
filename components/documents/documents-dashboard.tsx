"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FilePlus2, Files, Layers3, Users } from "lucide-react"

import { useLocale } from "@/hooks/use-locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  const [workflowMode, setWorkflowMode] = useState<"existing" | "new">("existing")
  const [clientQuery, setClientQuery] = useState("")
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [clientResults, setClientResults] = useState<
    Array<{
      id: string
      fullName?: string | null
      fullNameAr?: string | null
      nationalId?: string | null
      phone?: string | null
      city?: string | null
    }>
  >([])
  const [selectedClient, setSelectedClient] = useState<{
    id: string
    fullName?: string | null
    fullNameAr?: string | null
    nationalId?: string | null
    phone?: string | null
    city?: string | null
  } | null>(null)
  const [isLoadingClientHistory, setIsLoadingClientHistory] = useState(false)
  const [clientHistory, setClientHistory] = useState<
    Array<{
      documentId: string
      createdAt: string
      template: { title: string; titleAr?: string | null; slug: string }
      status: { name: string; nameAr?: string | null; color?: string | null }
    }>
  >([])

  useEffect(() => {
    const trimmed = clientQuery.trim()
    if (trimmed.length < 2) {
      setClientResults([])
      setIsSearchingClients(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearchingClients(true)
      try {
        const response = await fetch(
          `/api/personas?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: controller.signal },
        )
        if (!response.ok) {
          throw new Error("Client search failed")
        }
        const data = await response.json()
        setClientResults(Array.isArray(data) ? data : [])
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          console.error("Client search failed:", error)
        }
      } finally {
        setIsSearchingClients(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [clientQuery])

  const loadClientHistory = async (client: {
    id: string
    fullName?: string | null
    fullNameAr?: string | null
    nationalId?: string | null
    phone?: string | null
    city?: string | null
  }) => {
    setSelectedClient(client)
    setIsLoadingClientHistory(true)
    try {
      const response = await fetch(`/api/personas/${client.id}/documents?page=1&pageSize=12`)
      if (!response.ok) {
        throw new Error("Client history fetch failed")
      }
      const data = await response.json()
      setClientHistory(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      console.error("Client history fetch failed:", error)
      setClientHistory([])
    } finally {
      setIsLoadingClientHistory(false)
    }
  }

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
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-sm text-muted-foreground">{t("documents.loading")}</div>
      </div>
    )
  }

  const filteredCount = documents.length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">CyberDoc</p>
            <h1 className="text-3xl font-bold tracking-tight">{t("documents.title")}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{t("documents.subtitle")}</p>
          </div>
          <Button size="lg" className="min-w-44" asChild>
            <Link href="/documents/create?entryMode=new">
              <FilePlus2 className="mr-2 h-4 w-4" />
              {t("documents.newDocument")}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("documents.workflow.title", { defaultValue: "Parcours guidé" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("documents.workflow.subtitle", {
                defaultValue:
                  "Choisissez le mode de travail: client existant (réutilisation obligatoire) ou nouveau client.",
              })}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={workflowMode === "existing" ? "default" : "outline"}
                onClick={() => setWorkflowMode("existing")}
              >
                {t("documents.workflow.existing", { defaultValue: "Client existant" })}
              </Button>
              <Button
                type="button"
                variant={workflowMode === "new" ? "default" : "outline"}
                onClick={() => setWorkflowMode("new")}
              >
                {t("documents.workflow.new", { defaultValue: "Nouveau client" })}
              </Button>
            </div>
          </div>

          {workflowMode === "new" ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t("documents.workflow.newHint", {
                  defaultValue:
                    "Utilisez ce mode pour un client jamais enregistré. La fiche client sera créée automatiquement à la génération.",
                })}
              </p>
              <div className="mt-3">
                <Button asChild>
                  <Link href="/documents/create?entryMode=new">
                    {t("documents.workflow.startNewClient", {
                      defaultValue: "Démarrer avec un nouveau client",
                    })}
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          {workflowMode === "existing" ? (
            <>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("documents.clients.title", { defaultValue: "Recherche client" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("documents.clients.subtitle", {
                defaultValue:
                  "Retrouvez un client existant par nom, CIN ou téléphone, puis accédez à son historique.",
              })}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              <Input
                value={clientQuery}
                onChange={(event) => setClientQuery(event.target.value)}
                placeholder={t("documents.clients.searchPlaceholder", {
                  defaultValue: "Nom, CIN ou téléphone...",
                })}
              />
              <div className="rounded-lg border bg-muted/30 p-3">
                {isSearchingClients ? (
                  <p className="text-sm text-muted-foreground">
                    {t("documents.clients.searching", { defaultValue: "Recherche en cours..." })}
                  </p>
                ) : clientResults.length ? (
                  <div className="space-y-2">
                    {clientResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => loadClientHistory(client)}
                        className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm transition hover:border-primary/40"
                      >
                        <span className="font-medium">{client.fullNameAr || client.fullName || "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.nationalId || client.phone || client.city || client.id.slice(0, 8)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("documents.clients.noResults", {
                      defaultValue: "Aucun client trouvé. Continuez avec un nouveau client.",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              {selectedClient ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selectedClient.fullNameAr || selectedClient.fullName || "—"}</p>
                  <p className="text-muted-foreground">
                    {selectedClient.nationalId || "—"} · {selectedClient.phone || "—"}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/documents/create?personaId=${selectedClient.id}&entryMode=existing`}>
                      {t("documents.clients.createNewForClient", {
                        defaultValue: "Créer un nouveau document pour ce client",
                      })}
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("documents.clients.selectHint", {
                    defaultValue: "Sélectionnez un client pour afficher son historique.",
                  })}
                </p>
              )}
            </div>
          </div>

          {selectedClient ? (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">
                {t("documents.clients.historyTitle", { defaultValue: "Historique du client" })}
              </p>
              {isLoadingClientHistory ? (
                <p className="text-sm text-muted-foreground">
                  {t("documents.clients.loadingHistory", { defaultValue: "Chargement de l'historique..." })}
                </p>
              ) : clientHistory.length ? (
                <div className="space-y-2">
                  {clientHistory.map((entry) => (
                    <div
                      key={entry.documentId}
                      className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.template.titleAr || entry.template.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/documents/${entry.documentId}`}>
                            {t("documents.actions.view")}
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/documents/create?documentId=${entry.documentId}&entryMode=existing`}>
                            {t("documents.actions.newVersion")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("documents.clients.emptyHistory", {
                    defaultValue: "Aucun document trouvé pour ce client.",
                  })}
                </p>
              )}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("documents.workflow.existingHint", {
              defaultValue:
                "En mode client existant, la génération exige une fiche client sélectionnée depuis la recherche.",
            })}
          </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("documents.cards.title")}</p>
              <p className="text-2xl font-semibold">{totalDocuments}</p>
            </div>
            <Files className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("documents.applyFilters")}</p>
              <p className="text-2xl font-semibold">{filteredCount}</p>
            </div>
            <Layers3 className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("documents.templateFilter")}</p>
              <p className="text-2xl font-semibold">{templates.length}</p>
            </div>
            <Layers3 className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("documents.creatorFilter")}</p>
              <p className="text-2xl font-semibold">{creators.length}</p>
            </div>
            <Users className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <DocumentCards data={documents} />
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
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
              createdBy: "all",
            }
            setFilters(reset)
            setAppliedFilters(reset)
            setPage(1)
          }}
        />

        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
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
    </div>
  )
}
