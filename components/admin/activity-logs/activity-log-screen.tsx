"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ActivityLogFilterForm } from "@/components/admin/activity-logs/activity-log-filters";
import { ActivityLogResults } from "@/components/admin/activity-logs/activity-log-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/hooks/use-locale";
import type {
  ActivityLogFilters,
  ActivityLogPage,
} from "@/types/activity-logs";

const emptyFilters: ActivityLogFilters = {
  q: "",
  activityType: "",
  resourceType: "",
  userId: "",
  from: "",
  to: "",
  pageSize: "20",
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function filtersFromParams(params: URLSearchParams): ActivityLogFilters {
  return {
    q: params.get("q") ?? "",
    activityType: params.get("activityType") ?? "",
    resourceType: params.get("resourceType") ?? "",
    userId: params.get("userId") ?? "",
    from: toLocalDateTime(params.get("from")),
    to: toLocalDateTime(params.get("to")),
    pageSize: params.get("pageSize") ?? "20",
  };
}

export function ActivityLogScreen() {
  const { t, dir, isRTL, language } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [filters, setFilters] = useState(() =>
    filtersFromParams(new URLSearchParams(query)),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNavigating, startTransition] = useTransition();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const requestKey = `${query}:${refreshKey}`;
  const [requestState, setRequestState] = useState<{
    key: string;
    result: ActivityLogPage | null;
    error: string | null;
  }>({ key: "", result: null, error: null });
  const isLoading = requestState.key !== requestKey;
  const result = isLoading ? null : requestState.result;
  const error = isLoading ? null : requestState.error;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/activity-logs?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("activityAudit.error.description"));
        return (await response.json()) as ActivityLogPage;
      })
      .then((data) =>
        setRequestState({ key: requestKey, result: data, error: null }),
      )
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setRequestState({
          key: requestKey,
          result: null,
          error:
            reason instanceof Error
              ? reason.message
              : t("activityAudit.error.description"),
        });
      });
    return () => controller.abort();
  }, [query, requestKey, t]);

  const updateUrl = useCallback(
    (next: URLSearchParams) => {
      const suffix = next.toString();
      startTransition(() =>
        router.replace(suffix ? `${pathname}?${suffix}` : pathname),
      );
    },
    [pathname, router],
  );

  const applyFilters = () => {
    const next = new URLSearchParams();
    for (const name of [
      "q",
      "activityType",
      "resourceType",
      "userId",
    ] as const) {
      const value = filters[name].trim();
      if (value) next.set(name, value);
    }
    for (const name of ["from", "to"] as const) {
      if (filters[name]) next.set(name, new Date(filters[name]).toISOString());
    }
    if (filters.pageSize !== "20") next.set("pageSize", filters.pageSize);
    updateUrl(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(query);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    updateUrl(next);
  };

  const statusText = useMemo(() => {
    if (!result) return "";
    return t("activityAudit.results", {
      count: result.data.length,
      total: result.total,
      page: result.page,
      totalPages: Math.max(1, result.totalPages),
    });
  }, [result, t]);

  return (
    <div className="space-y-6" dir={dir} data-testid="activity-log-page">
      <header className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-900 via-sky-900 to-teal-800 p-6 text-white shadow-lg shadow-slate-900/15 dark:from-slate-800 dark:via-sky-900 dark:to-teal-900">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
          <History className="h-3.5 w-3.5" aria-hidden />
          {t("activityAudit.badge")}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("activityAudit.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">
          {t("activityAudit.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("activityAudit.filters.title")}</CardTitle>
          <CardDescription>
            {t("activityAudit.filters.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityLogFilterForm
            filters={filters}
            onChange={(name, value) =>
              setFilters((current) => ({ ...current, [name]: value }))
            }
            onSubmit={applyFilters}
            onReset={() => {
              setFilters(emptyFilters);
              updateUrl(new URLSearchParams());
            }}
            pending={isNavigating || isLoading}
            t={t}
          />
        </CardContent>
      </Card>

      <Card aria-busy={isLoading}>
        <CardHeader>
          <CardTitle>{t("activityAudit.listTitle")}</CardTitle>
          <CardDescription aria-live="polite">{statusText}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="space-y-3"
              role="status"
              aria-label={t("activityAudit.loading")}
            >
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" data-testid="activity-log-error">
              <AlertCircle aria-hidden />
              <AlertTitle>{t("activityAudit.error.title")}</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  <RefreshCw aria-hidden />
                  {t("activityAudit.error.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <ActivityLogResults
              entries={result?.data ?? []}
              language={language}
              isRTL={isRTL}
              t={t}
            />
          )}

          {!isLoading && !error && result && result.totalPages > 1 ? (
            <nav
              className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
              aria-label={t("activityAudit.pagination.label")}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || isNavigating}
              >
                {isRTL ? (
                  <ChevronRight aria-hidden />
                ) : (
                  <ChevronLeft aria-hidden />
                )}
                {t("activityAudit.pagination.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("activityAudit.pagination.current", {
                  page,
                  totalPages: result.totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={page >= result.totalPages || isNavigating}
              >
                {t("activityAudit.pagination.next")}
                {isRTL ? (
                  <ChevronLeft aria-hidden />
                ) : (
                  <ChevronRight aria-hidden />
                )}
              </Button>
            </nav>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
