import fs from "node:fs/promises";
import path from "node:path";

const apiRoot = path.join(process.cwd(), "app", "api");
const outDir = path.join(process.cwd(), "tmp", "contract-audit");

const ROUTE_FILE = "route.ts";
const MUTATION_METHOD_RE = /export\s+async\s+function\s+(POST|PATCH|PUT)\b/g;
const USES_JSON_RE = /request\.json\s*\(/;
const HAS_VALIDATION_RE = /\b(safeParse|parse)\s*\(|z\.object\s*\(/;

async function listRouteFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listRouteFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name === ROUTE_FILE) {
      files.push(fullPath);
    }
  }

  return files;
}

async function run() {
  const routeFiles = await listRouteFiles(apiRoot);
  const checks = [];

  for (const routeFile of routeFiles) {
    const content = await fs.readFile(routeFile, "utf8");
    const methods = [...content.matchAll(MUTATION_METHOD_RE)].map((match) => match[1]);
    if (!methods.length) continue;

    const usesJson = USES_JSON_RE.test(content);
    const hasValidation = HAS_VALIDATION_RE.test(content);
    const isOk = !usesJson || hasValidation;

    checks.push({
      route: path.relative(process.cwd(), routeFile).replaceAll("\\", "/"),
      methods,
      usesJson,
      hasValidation,
      ok: isOk,
      details: isOk
        ? "validated-or-no-json-body"
        : "json-body-without-zod-parse-detected",
    });
  }

  const passCount = checks.filter((check) => check.ok).length;
  const failCount = checks.length - passCount;
  const report = {
    generatedAt: new Date().toISOString(),
    totalChecked: checks.length,
    passCount,
    failCount,
    checks,
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "results.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("contract-audit failed:", error);
  process.exit(1);
});
