import { Filter, RotateCcw, Search } from "lucide-react";
import type { TFunction } from "i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivityLogFilters } from "@/types/activity-logs";

type Props = {
  filters: ActivityLogFilters;
  onChange: (name: keyof ActivityLogFilters, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  pending: boolean;
  t: TFunction;
};

export function ActivityLogFilterForm({
  filters,
  onChange,
  onSubmit,
  onReset,
  pending,
  t,
}: Props) {
  const fields: Array<{
    name: keyof Pick<
      ActivityLogFilters,
      "q" | "activityType" | "resourceType" | "userId"
    >;
    type?: string;
  }> = [
    { name: "q", type: "search" },
    { name: "activityType" },
    { name: "resourceType" },
    { name: "userId" },
  ];

  return (
    <form
      className="space-y-4"
      data-testid="activity-log-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map(({ name, type }) => (
          <label key={name} className="space-y-1.5 text-sm font-medium">
            <span>{t(`activityAudit.filters.${name}`)}</span>
            <Input
              name={name}
              type={type}
              value={filters[name]}
              onChange={(event) => onChange(name, event.target.value)}
              placeholder={t(`activityAudit.filters.${name}Placeholder`)}
              autoComplete="off"
            />
          </label>
        ))}
        <label className="space-y-1.5 text-sm font-medium">
          <span>{t("activityAudit.filters.from")}</span>
          <Input
            name="from"
            type="datetime-local"
            value={filters.from}
            onChange={(event) => onChange("from", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>{t("activityAudit.filters.to")}</span>
          <Input
            name="to"
            type="datetime-local"
            value={filters.to}
            onChange={(event) => onChange("to", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>{t("activityAudit.filters.pageSize")}</span>
          <select
            name="pageSize"
            value={filters.pageSize}
            onChange={(event) => onChange("pageSize", event.target.value)}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          <Search aria-hidden />
          {t("activityAudit.filters.apply")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={pending}
        >
          <RotateCcw aria-hidden />
          {t("activityAudit.filters.reset")}
        </Button>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          {t("activityAudit.filters.hint")}
        </span>
      </div>
    </form>
  );
}
