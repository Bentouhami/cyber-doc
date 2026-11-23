export interface RouteAssetBudget {
  route: string;
  manifestRoute: string;
  javascriptGzipBytes: number;
  cssGzipBytes: number;
}

export interface RouteAssetMeasurement {
  route: string;
  javascriptGzipBytes: number;
  cssGzipBytes: number;
}

export interface RouteAssetManifest {
  entryJSFiles?: Record<string, string[]>;
  entryCSSFiles: Record<string, Array<{ path: string }>>;
  clientModules?: Record<string, { chunks?: Array<string | number> }>;
}

export type RouteBudgetViolation = {
  route: string;
  metric: "javascriptGzipBytes" | "cssGzipBytes" | "missing";
  actualBytes: number | null;
  limitBytes: number | null;
};

const KIBIBYTE = 1024;
const CSS_BUDGET_BYTES = 25 * KIBIBYTE;

export const ROUTE_ASSET_BUDGETS: RouteAssetBudget[] = [
  { route: "/", manifestRoute: "page", javascriptGzipBytes: 75 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/documents", manifestRoute: "documents/page", javascriptGzipBytes: 120 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/documents/create", manifestRoute: "documents/create/page", javascriptGzipBytes: 195 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/admin/employees", manifestRoute: "admin/employees/page", javascriptGzipBytes: 175 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/admin/templates", manifestRoute: "admin/templates/page", javascriptGzipBytes: 116 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/admin/templates/new", manifestRoute: "admin/templates/new/page", javascriptGzipBytes: 135 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
  { route: "/admin/templates/[slug]", manifestRoute: "admin/templates/[slug]/page", javascriptGzipBytes: 135 * KIBIBYTE, cssGzipBytes: CSS_BUDGET_BYTES },
];

export function parseClientReferenceManifest(source: string): RouteAssetManifest {
  const markerIndex = source.indexOf("__RSC_MANIFEST[");
  const assignment = markerIndex === -1 ? null : source.slice(markerIndex).match(/\]\s*=\s*/);
  if (!assignment || assignment.index === undefined) {
    throw new Error("Unsupported client-reference manifest format");
  }
  const jsonStart = markerIndex + assignment.index + assignment[0].length;
  return JSON.parse(source.slice(jsonStart).trim().replace(/;$/, ""));
}

export function collectRouteAssetPaths(manifest: RouteAssetManifest) {
  const javascript = new Set([
    ...Object.values(manifest.entryJSFiles ?? {}).flat(),
    ...Object.values(manifest.clientModules ?? {})
      .flatMap((module) => module.chunks ?? [])
      .filter((chunk): chunk is string => typeof chunk === "string" && chunk.endsWith(".js")),
  ]);
  const css = new Set(
    Object.values(manifest.entryCSSFiles)
      .flat()
      .map((entry) => entry.path),
  );

  return {
    javascript: [...javascript].sort(),
    css: [...css].sort(),
  };
}

export function evaluateRouteBudgets(
  measurements: RouteAssetMeasurement[],
  budgets: RouteAssetBudget[],
) {
  const measurementsByRoute = new Map(measurements.map((measurement) => [measurement.route, measurement]));
  const violations: RouteBudgetViolation[] = [];

  for (const budget of budgets) {
    const measurement = measurementsByRoute.get(budget.route);
    if (!measurement) {
      violations.push({
        route: budget.route,
        metric: "missing",
        actualBytes: null,
        limitBytes: null,
      });
      continue;
    }

    for (const metric of ["javascriptGzipBytes", "cssGzipBytes"] as const) {
      if (measurement[metric] > budget[metric]) {
        violations.push({
          route: budget.route,
          metric,
          actualBytes: measurement[metric],
          limitBytes: budget[metric],
        });
      }
    }
  }

  return violations;
}
