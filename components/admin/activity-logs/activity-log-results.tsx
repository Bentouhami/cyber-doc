import { History } from "lucide-react";
import type { TFunction } from "i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLogEntry } from "@/types/activity-logs";

type Props = {
  entries: ActivityLogEntry[];
  language: string;
  isRTL: boolean;
  t: TFunction;
};

export function ActivityLogResults({ entries, language, isRTL, t }: Props) {
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : "fr-BE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const alignment = isRTL ? "text-right" : "text-left";

  if (entries.length === 0) {
    return (
      <div
        className="py-12 text-center"
        role="status"
        data-testid="activity-log-empty"
      >
        <History
          className="mx-auto h-8 w-8 text-muted-foreground"
          aria-hidden
        />
        <h2 className="mt-3 font-semibold">{t("activityAudit.empty.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("activityAudit.empty.description")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid gap-3 md:hidden"
        data-testid="activity-log-mobile-list"
      >
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-lg border bg-background p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{entry.activityType}</h2>
                <p className="text-sm text-muted-foreground">
                  {entry.category}
                </p>
              </div>
              <Badge variant="secondary">{entry.resource.type}</Badge>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  {t("activityAudit.columns.actor")}
                </dt>
                <dd className="break-words">{entry.actor.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("activityAudit.columns.resource")}
                </dt>
                <dd className="break-all font-mono text-xs">
                  {entry.resource.id}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("activityAudit.columns.date")}
                </dt>
                <dd>
                  <time dateTime={entry.createdAt}>
                    {formatDate(entry.createdAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border md:block">
        <Table aria-label={t("activityAudit.tableLabel")}>
          <TableHeader>
            <TableRow>
              {(["type", "actor", "resource", "date"] as const).map(
                (column) => (
                  <TableHead key={column} className={alignment}>
                    {t(`activityAudit.columns.${column}`)}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className={alignment}>
                  <div className="font-medium">{entry.activityType}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.category}
                  </div>
                </TableCell>
                <TableCell className={alignment}>{entry.actor.name}</TableCell>
                <TableCell className={alignment}>
                  <Badge variant="secondary">{entry.resource.type}</Badge>
                  <div
                    className="mt-1 max-w-64 truncate font-mono text-xs text-muted-foreground"
                    title={entry.resource.id}
                  >
                    {entry.resource.id}
                  </div>
                </TableCell>
                <TableCell className={alignment}>
                  <time dateTime={entry.createdAt}>
                    {formatDate(entry.createdAt)}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
