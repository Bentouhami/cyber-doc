import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import {
  collectRouteAssetPaths,
  evaluateRouteBudgets,
  ROUTE_ASSET_BUDGETS,
  type RouteAssetManifest,
  type RouteAssetMeasurement,
} from "./budget-policy";

const BUILD_DIRECTORY = path.resolve(process.cwd(), ".next");

function readRouteManifest(manifestRoute: string): RouteAssetManifest {
  const manifestPath = path.join(
    BUILD_DIRECTORY,
    "server",
    "app",
    ...manifestRoute.split("/"),
  ) + "_client-reference-manifest.js";
  const source = readFileSync(manifestPath, "utf8");
  const assignmentIndex = source.indexOf("] = ");

  if (assignmentIndex === -1) {
    throw new Error(`Unsupported client-reference manifest format: ${manifestPath}`);
  }

  const serializedManifest = source
    .slice(assignmentIndex + 4)
    .trim()
    .replace(/;$/, "");
  return JSON.parse(serializedManifest) as RouteAssetManifest;
}

function resolveBuildAsset(assetPath: string) {
  const resolvedPath = path.resolve(BUILD_DIRECTORY, assetPath);
  const buildPrefix = `${BUILD_DIRECTORY}${path.sep}`;

  if (!resolvedPath.startsWith(buildPrefix)) {
    throw new Error(`Build manifest contains an asset outside .next: ${assetPath}`);
  }

  return resolvedPath;
}

function gzipBytes(assetPaths: string[]) {
  return assetPaths.reduce(
    (total, assetPath) =>
      total + gzipSync(readFileSync(resolveBuildAsset(assetPath)), { level: 6 }).byteLength,
    0,
  );
}

function measureRoutes(): RouteAssetMeasurement[] {
  return ROUTE_ASSET_BUDGETS.map((budget) => {
    const assets = collectRouteAssetPaths(readRouteManifest(budget.manifestRoute));
    return {
      route: budget.route,
      javascriptGzipBytes: gzipBytes(assets.javascript),
      cssGzipBytes: gzipBytes(assets.css),
    };
  });
}

function formatKibibytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

try {
  const measurements = measureRoutes();
  const violations = evaluateRouteBudgets(measurements, ROUTE_ASSET_BUDGETS);

  for (const measurement of measurements) {
    const budget = ROUTE_ASSET_BUDGETS.find((candidate) => candidate.route === measurement.route);
    if (!budget) {
      continue;
    }
    console.log(
      `${measurement.route}: JS ${formatKibibytes(measurement.javascriptGzipBytes)} / ${formatKibibytes(budget.javascriptGzipBytes)}, CSS ${formatKibibytes(measurement.cssGzipBytes)} / ${formatKibibytes(budget.cssGzipBytes)}`,
    );
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      if (violation.metric === "missing") {
        console.error(`${violation.route}: required performance measurement is missing`);
      } else {
        console.error(
          `${violation.route}: ${violation.metric} is ${formatKibibytes(violation.actualBytes ?? 0)}, limit ${formatKibibytes(violation.limitBytes ?? 0)}`,
        );
      }
    }
    process.exitCode = 1;
  } else {
    console.log(`performance-budgets: ${measurements.length} route budget(s) passed`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Performance budget check failed");
  process.exitCode = 1;
}
