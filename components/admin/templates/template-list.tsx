"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  CircleDollarSign,
  FileUp,
  FolderKanban,
  Globe,
  Inbox,
  Layers,
  Rows3,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { useToast } from "@/hooks/use-toast";

export type TemplateListItem = {
  id: string;
  slug: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  locale: string;
  version: number;
  isActive: boolean;
  hasHtml: boolean;
  basePrice?: number | null;
  reviewStatus?: string | null;
  archivedAt?: string | null;
  requestedByName?: string | null;
  requestedAt?: string | null;
  reviewComment?: string | null;
  createdAt: string;
  updatedAt: string;
  documentType: {
    name: string;
    nameAr?: string | null;
  };
  category: {
    name: string;
    nameAr?: string | null;
  };
  participantRoles: {
    roleKey: string;
    roleLabel: string;
    roleLabelAr?: string | null;
    isRequired: boolean;
    minParticipants: number;
    maxParticipants?: number | null;
  }[];
  fieldCount: number;
  asset?: {
    fileName: string;
    version: number | null;
  } | null;
};

type TemplateListProps = {
  templates: TemplateListItem[];
  mode?: "catalog" | "requests";
};

export function TemplateList({ templates, mode = "catalog" }: TemplateListProps) {
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const isRequestsMode = mode === "requests";

  const searchValue = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";
  const localeFilter = searchParams.get("locale") ?? "all";
  const typeFilter = searchParams.get("type") ?? "all";
  const categoryFilter = searchParams.get("category") ?? "all";

  const setQuery = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(
      `${pathname}${next.toString() ? `?${next.toString()}` : ""}`,
    );
  };

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(templates.map((template) => template.documentType.name)),
      ).sort((a, b) => a.localeCompare(b)),
    [templates],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(templates.map((template) => template.category.name)),
      ).sort((a, b) => a.localeCompare(b)),
    [templates],
  );

  const localeOptions = useMemo(
    () =>
      Array.from(new Set(templates.map((template) => template.locale))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const normalizedQuery = searchValue.trim().toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        template.title.toLowerCase().includes(normalizedQuery) ||
        (template.titleAr ?? "").toLowerCase().includes(normalizedQuery) ||
        (template.description ?? "").toLowerCase().includes(normalizedQuery) ||
        template.slug.toLowerCase().includes(normalizedQuery) ||
        template.documentType.name.toLowerCase().includes(normalizedQuery) ||
        (template.documentType.nameAr ?? "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        template.category.name.toLowerCase().includes(normalizedQuery) ||
        (template.category.nameAr ?? "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && template.isActive) ||
        (statusFilter === "inactive" && !template.isActive) ||
        (statusFilter === "draft" && template.reviewStatus === "PENDING") ||
        (statusFilter === "approved" && template.reviewStatus === "APPROVED") ||
        (statusFilter === "rejected" && template.reviewStatus === "REJECTED") ||
        (statusFilter === "archived" && Boolean(template.archivedAt));

      const matchesLocale =
        localeFilter === "all" || template.locale === localeFilter;
      const matchesType =
        typeFilter === "all" || template.documentType.name === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || template.category.name === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLocale &&
        matchesType &&
        matchesCategory
      );
    });
  }, [
    templates,
    searchValue,
    statusFilter,
    localeFilter,
    typeFilter,
    categoryFilter,
  ]);

  const allVisibleSelected =
    filteredTemplates.length > 0 &&
    filteredTemplates.every((template) => selectedIds.includes(template.id));

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((item) => item !== id),
    );
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredTemplates.some((item) => item.id === id)),
      );
      return;
    }
    setSelectedIds((prev) =>
      Array.from(
        new Set([...prev, ...filteredTemplates.map((item) => item.id)]),
      ),
    );
  };

  const runBulkStatusUpdate = async (isActive: boolean) => {
    const selectedTemplates = filteredTemplates.filter((template) =>
      selectedIds.includes(template.id),
    );
    if (!selectedTemplates.length) {
      toast({
        title: t("templates.bulk.nothingSelected"),
        variant: "destructive",
      });
      return;
    }

    setIsBulkRunning(true);
    let success = 0;
    let failed = 0;

    for (const template of selectedTemplates) {
      try {
        const response = await fetch(`/api/templates/${template.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        if (!response.ok) {
          failed += 1;
          continue;
        }
        success += 1;
      } catch {
        failed += 1;
      }
    }

    setIsBulkRunning(false);
    setSelectedIds([]);
    router.refresh();

    toast({
      title: t("templates.bulk.resultTitle"),
      description: t("templates.bulk.resultDescription", {
        success,
        failed,
      }),
      variant: failed ? "destructive" : "default",
    });
  };

  const exportSelectedToCsv = () => {
    const selectedTemplates = filteredTemplates.filter((template) =>
      selectedIds.includes(template.id),
    );
    if (!selectedTemplates.length) {
      toast({
        title: t("templates.bulk.nothingSelected"),
        variant: "destructive",
      });
      return;
    }

    const header = [
      "slug",
      "title",
      "titleAr",
      "status",
      "locale",
      "documentType",
      "category",
      "updatedAt",
    ];

    const rows = selectedTemplates.map((template) => [
      template.slug,
      template.title,
      template.titleAr ?? "",
      template.isActive ? "active" : "inactive",
      template.locale,
      template.documentType.name,
      template.category.name,
      template.updatedAt,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `templates-export-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runReviewAction = async (
    template: TemplateListItem,
    reviewStatus: "APPROVED" | "REJECTED",
  ) => {
    const reviewComment =
      reviewStatus === "REJECTED"
        ? (window.prompt(t("templates.review.rejectPrompt")) ?? "").trim()
        : null;

    if (reviewStatus === "REJECTED" && !reviewComment) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${template.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: reviewStatus === "APPROVED",
          metadata: {
            reviewStatus,
            reviewedAt: new Date().toISOString(),
            reviewComment: reviewStatus === "REJECTED" ? reviewComment : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(t("templates.review.actionError"));
      }

      toast({
        title: t("common.success"),
        description: t("templates.review.actionSuccess"),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("templates.review.actionError"),
        variant: "destructive",
      });
    }
  };

  const runArchiveAction = async (
    template: TemplateListItem,
    shouldArchive: boolean,
  ) => {
    try {
      const response = await fetch(`/api/templates/${template.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: shouldArchive ? false : template.isActive,
          metadata: {
            archivedAt: shouldArchive ? new Date().toISOString() : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(t("templates.archive.actionError"));
      }

      toast({
        title: t("common.success"),
        description: shouldArchive
          ? t("templates.archive.archivedSuccess")
          : t("templates.archive.unarchivedSuccess"),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("templates.archive.actionError"),
        variant: "destructive",
      });
    }
  };

  const runDuplicateAction = async (template: TemplateListItem) => {
    try {
      const response = await fetch(
        `/api/templates/${template.slug}/duplicate`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || t("templates.duplicate.actionError"));
      }

      const data = await response.json().catch(() => null);
      toast({
        title: t("common.success"),
        description: t("templates.duplicate.actionSuccess"),
      });
      if (
        data &&
        typeof data === "object" &&
        "slug" in data &&
        typeof data.slug === "string"
      ) {
        router.push(`/admin/templates/${data.slug}`);
        return;
      }
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error instanceof Error
            ? error.message
            : t("templates.duplicate.actionError"),
        variant: "destructive",
      });
    }
  };

  const getReviewBadge = (status?: string | null) => {
    if (status === "PENDING") {
      return <Badge variant="outline">{t("templates.statusDraft")}</Badge>;
    }
    if (status === "APPROVED") {
      return <Badge variant="default">{t("templates.statusApproved")}</Badge>;
    }
    if (status === "REJECTED") {
      return (
        <Badge variant="destructive">{t("templates.statusRejected")}</Badge>
      );
    }
    if (status === "DRAFT") {
      return <Badge variant="outline">{t("templates.statusDraft")}</Badge>;
    }
    return null;
  };

  if (!templates.length) {
    if (isRequestsMode) {
      return (
        <Card dir={dir} className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>{t("templates.requests.title")}</CardTitle>
            <CardDescription>
              {t("templates.requests.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{t("templates.requests.empty")}</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("templates.requests.emptyDescription")}
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admin/templates">
                {t("templates.requests.backToCatalog")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
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
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t(
              isRequestsMode
                ? "templates.requests.title"
                : "templates.title",
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              isRequestsMode
                ? "templates.requests.subtitle"
                : "templates.subtitle",
            )}
          </p>
        </div>
        {!isRequestsMode ? <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link
              href="/admin/templates/new"
              className="inline-flex items-center gap-2"
            >
              <FolderKanban className="h-4 w-4" />
              {t("templates.createAction")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href="/admin/templates/import"
              className="inline-flex items-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              {t("templates.importAction")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href="/admin/templates/import?mode=word"
              className="inline-flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              {t("templates.gap.importWord")}
            </Link>
          </Button>
        </div> : null}
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            {t(
              isRequestsMode
                ? "templates.requests.filtersTitle"
                : "templates.filters.title",
            )}
          </CardTitle>
          <CardDescription>
            {t(
              isRequestsMode
                ? "templates.requests.filtersDescription"
                : "templates.filters.description",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="template-search">
              {t("templates.filters.search")}
            </Label>
            <Input
              id="template-search"
              className="h-11"
              value={searchValue}
              onChange={(event) => setQuery("q", event.target.value)}
              placeholder={t("templates.filters.search")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-status-filter">
              {t("templates.filters.status")}
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setQuery("status", value)}
            >
              <SelectTrigger id="template-status-filter" className="h-11">
                <SelectValue placeholder={t("templates.filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("templates.filters.allStatuses")}
                </SelectItem>
                <SelectItem value="active">
                  {t("templates.statusActive")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("templates.statusInactive")}
                </SelectItem>
                <SelectItem value="draft">
                  {t("templates.statusDraft")}
                </SelectItem>
                <SelectItem value="approved">
                  {t("templates.statusApproved")}
                </SelectItem>
                <SelectItem value="rejected">
                  {t("templates.statusRejected")}
                </SelectItem>
                <SelectItem value="archived">
                  {t("templates.statusArchived")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-locale-filter">
              {t("templates.filters.locale")}
            </Label>
            <Select
              value={localeFilter}
              onValueChange={(value) => setQuery("locale", value)}
            >
              <SelectTrigger id="template-locale-filter" className="h-11">
                <SelectValue placeholder={t("templates.filters.locale")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("templates.filters.allLocales")}
                </SelectItem>
                {localeOptions.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-type-filter">
              {t("templates.filters.documentType")}
            </Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => setQuery("type", value)}
            >
              <SelectTrigger id="template-type-filter" className="h-11">
                <SelectValue
                  placeholder={t("templates.filters.documentType")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("templates.filters.allTypes")}
                </SelectItem>
                {typeOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-category-filter">
              {t("templates.filters.category")}
            </Label>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setQuery("category", value)}
            >
              <SelectTrigger id="template-category-filter" className="h-11">
                <SelectValue placeholder={t("templates.filters.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("templates.filters.allCategories")}
                </SelectItem>
                {categoryOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.replace(pathname)}
              className="px-0 text-sm"
            >
              {t("templates.filters.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {!isRequestsMode ? <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(checked) =>
                toggleSelectAllVisible(checked === true)
              }
            />
            <span>{t("templates.bulk.selectAllVisible")}</span>
          </label>
          <Badge variant="outline">
            {t("templates.bulk.selectedCount", { count: selectedIds.length })}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => runBulkStatusUpdate(true)}
            disabled={isBulkRunning || !selectedIds.length}
          >
            {t("templates.bulk.publish")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => runBulkStatusUpdate(false)}
            disabled={isBulkRunning || !selectedIds.length}
          >
            {t("templates.bulk.unpublish")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportSelectedToCsv}
            disabled={isBulkRunning || !selectedIds.length}
          >
            {t("templates.bulk.exportCsv")}
          </Button>
        </CardContent>
      </Card> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="flex h-full min-w-0 flex-col overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex min-w-0 flex-wrap items-center gap-2 text-xl">
                  {!isRequestsMode ? <Checkbox
                    checked={selectedIds.includes(template.id)}
                    onCheckedChange={(checked) =>
                      toggleSelected(template.id, checked === true)
                    }
                    aria-label={t("templates.bulk.selectTemplate", {
                      title: template.titleAr || template.title,
                    })}
                  /> : null}
                  <FolderKanban className="h-5 w-5 text-primary" />
                  <span className="min-w-0 break-words">{template.titleAr || template.title}</span>
                </CardTitle>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive
                    ? t("templates.statusActive")
                    : t("templates.statusInactive")}
                </Badge>
                {getReviewBadge(template.reviewStatus)}
                {template.archivedAt ? (
                  <Badge variant="secondary">
                    {t("templates.statusArchived")}
                  </Badge>
                ) : null}
                {!template.hasHtml ? (
                  <Badge variant="destructive">
                    {t("templates.missingHtml")}
                  </Badge>
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
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <CircleDollarSign className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("templates.basePrice")}
                    </p>
                    <p className="font-semibold tabular-nums">
                      {template.basePrice !== null &&
                      template.basePrice !== undefined
                        ? `${template.basePrice} MAD`
                        : t("templates.priceNotConfigured")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {t("templates.fieldsCount", { count: template.fieldCount })}
                  </Badge>
                  <Badge variant="outline">
                    {t("templates.participantCount", {
                      count: template.participantRoles.length,
                    })}
                  </Badge>
                  {template.asset ? (
                    <Badge variant="outline" className="font-normal">
                      {template.asset.fileName} · v
                      {template.asset.version ?? template.version}
                    </Badge>
                  ) : null}
                </div>
                {template.participantRoles.length ? (
                  <div className="flex flex-wrap gap-2">
                    {template.participantRoles.map((role) => (
                      <Badge
                        key={`${template.id}-${role.roleKey}`}
                        variant="secondary"
                        className="font-normal"
                      >
                        {role.roleLabelAr || role.roleLabel}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  {template.requestedByName ? (
                    <div>
                      {t("templates.review.requestedBy")}:{" "}
                      {template.requestedByName}
                    </div>
                  ) : null}
                  {template.requestedAt ? (
                    <div>
                      {t("templates.review.requestedAt")}:{" "}
                      {new Date(template.requestedAt).toLocaleString(
                        undefined,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </div>
                  ) : null}
                  {template.reviewComment ? (
                    <div>
                      {t("templates.review.reviewComment")}:{" "}
                      {template.reviewComment}
                    </div>
                  ) : null}
                  {template.archivedAt ? (
                    <div>
                      {t("templates.archive.archivedAt")}:{" "}
                      {new Date(template.archivedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  ) : null}
                  <div>
                    {t("templates.updatedAt")}:{" "}
                    {new Date(template.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div>
                    {t("templates.createdAt")}:{" "}
                    {new Date(template.createdAt).toLocaleDateString(
                      undefined,
                      { dateStyle: "medium" },
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge variant="outline" className="max-w-full whitespace-normal break-all font-normal">
                  {t("templates.slug")}: {template.slug}
                </Badge>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {template.reviewStatus === "PENDING" ? (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => runReviewAction(template, "APPROVED")}
                      >
                        {t("templates.review.approve")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => runReviewAction(template, "REJECTED")}
                      >
                        {t("templates.review.reject")}
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => runDuplicateAction(template)}
                  >
                    {t("templates.duplicate.action")}
                  </Button>
                  {template.archivedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runArchiveAction(template, false)}
                    >
                      {t("templates.archive.unarchive")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runArchiveAction(template, true)}
                    >
                      {t("templates.archive.archive")}
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link
                      href={`/admin/templates/${template.slug}`}
                      className="inline-flex items-center gap-2"
                    >
                      <span>{t("templates.viewDetails")}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!filteredTemplates.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t(
              isRequestsMode
                ? "templates.requests.emptyResult"
                : "templates.filters.emptyResult",
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
