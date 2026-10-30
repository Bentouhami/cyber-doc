import assert from "node:assert/strict";
import test from "node:test";

import {
  collectRouteAssetPaths,
  evaluateRouteBudgets,
  type RouteAssetBudget,
} from "../../scripts/performance/budget-policy";

const budget: RouteAssetBudget = {
  route: "/documents",
  manifestRoute: "documents/page",
  javascriptGzipBytes: 120 * 1024,
  cssGzipBytes: 25 * 1024,
};

test("collectRouteAssetPaths counts shared assets only once", () => {
  const assets = collectRouteAssetPaths({
    entryJSFiles: {
      layout: ["static/chunks/shared.js"],
      page: ["static/chunks/shared.js", "static/chunks/page.js"],
    },
    entryCSSFiles: {
      layout: [{ path: "static/chunks/app.css" }],
      page: [{ path: "static/chunks/app.css" }],
    },
  });

  assert.deepEqual(assets.javascript, ["static/chunks/page.js", "static/chunks/shared.js"]);
  assert.deepEqual(assets.css, ["static/chunks/app.css"]);
});

test("evaluateRouteBudgets accepts measurements exactly at their limits", () => {
  assert.deepEqual(
    evaluateRouteBudgets(
      [{ route: "/documents", javascriptGzipBytes: 120 * 1024, cssGzipBytes: 25 * 1024 }],
      [budget],
    ),
    [],
  );
});

test("evaluateRouteBudgets reports every exceeded asset budget", () => {
  assert.deepEqual(
    evaluateRouteBudgets(
      [{ route: "/documents", javascriptGzipBytes: 120 * 1024 + 1, cssGzipBytes: 25 * 1024 + 1 }],
      [budget],
    ),
    [
      {
        route: "/documents",
        metric: "javascriptGzipBytes",
        actualBytes: 120 * 1024 + 1,
        limitBytes: 120 * 1024,
      },
      {
        route: "/documents",
        metric: "cssGzipBytes",
        actualBytes: 25 * 1024 + 1,
        limitBytes: 25 * 1024,
      },
    ],
  );
});

test("evaluateRouteBudgets fails closed when a required route is missing", () => {
  assert.deepEqual(evaluateRouteBudgets([], [budget]), [
    {
      route: "/documents",
      metric: "missing",
      actualBytes: null,
      limitBytes: null,
    },
  ]);
});
