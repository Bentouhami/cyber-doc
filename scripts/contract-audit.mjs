import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const apiRoot = path.join(process.cwd(), "app", "api");
const outDir = path.join(process.cwd(), "tmp", "contract-audit");
const fixturesRoot = path.join(process.cwd(), "scripts", "quality", "fixtures", "contract-audit");

const ROUTE_FILE = "route.ts";
const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const SCHEMA_PARSE_METHODS = new Set(["parse", "parseAsync", "safeParse", "safeParseAsync"]);

async function listRouteFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listRouteFiles(fullPath)));
    } else if (entry.isFile() && entry.name === ROUTE_FILE) {
      files.push(fullPath);
    }
  }
  return files;
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function isExported(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function getMutationHandlers(sourceFile) {
  const handlers = [];
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      statement.body &&
      isExported(statement) &&
      MUTATION_METHODS.has(statement.name.text)
    ) {
      handlers.push({ method: statement.name.text, node: statement });
    }
  }
  return handlers;
}

function isRequestJsonCall(node, requestParameterName) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "json" &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === requestParameterName
  );
}

function nodeContains(node, predicate) {
  let found = false;
  visit(node, (candidate) => {
    if (!found && predicate(candidate)) found = true;
  });
  return found;
}

function collectBindingNames(name, output) {
  if (ts.isIdentifier(name)) {
    output.add(name.text);
    return;
  }
  for (const element of name.elements) {
    if (ts.isBindingElement(element)) collectBindingNames(element.name, output);
  }
}

function containsTaintedValue(node, taintedNames, requestParameterName) {
  return nodeContains(
    node,
    (candidate) =>
      isRequestJsonCall(candidate, requestParameterName) ||
      (ts.isIdentifier(candidate) && taintedNames.has(candidate.text)),
  );
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function analyzeHandler(sourceFile, method, handler) {
  const requestParameter = handler.parameters[0]?.name;
  const requestParameterName = ts.isIdentifier(requestParameter) ? requestParameter.text : null;
  if (!requestParameterName) {
    return {
      method,
      usesJson: false,
      validationKind: "not-applicable",
      evidenceLines: [],
      ok: true,
      details: "no-identifiable-request-parameter",
    };
  }

  const bodyReads = [];
  visit(handler.body, (node) => {
    if (isRequestJsonCall(node, requestParameterName)) bodyReads.push(node);
  });
  if (bodyReads.length === 0) {
    return {
      method,
      usesJson: false,
      validationKind: "not-applicable",
      evidenceLines: [],
      ok: true,
      details: "mutation-does-not-read-json-body",
    };
  }

  const taintedNames = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    visit(handler.body, (node) => {
      if (
        !ts.isVariableDeclaration(node) ||
        !node.initializer ||
        !containsTaintedValue(node.initializer, taintedNames, requestParameterName)
      ) return;

      const names = new Set();
      collectBindingNames(node.name, names);
      for (const name of names) {
        if (!taintedNames.has(name)) {
          taintedNames.add(name);
          changed = true;
        }
      }
    });
  }

  const schemaEvidence = [];
  const manualGuardEvidence = [];
  visit(handler.body, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      SCHEMA_PARSE_METHODS.has(node.expression.name.text) &&
      node.arguments.some((argument) => containsTaintedValue(argument, taintedNames, requestParameterName))
    ) schemaEvidence.push(node);

    const guardExpression = ts.isConditionalExpression(node)
      ? node.condition
      : ts.isIfStatement(node) || ts.isSwitchStatement(node)
        ? node.expression
        : null;
    if (
      guardExpression &&
      containsTaintedValue(guardExpression, taintedNames, requestParameterName)
    ) manualGuardEvidence.push(node);
  });

  const evidence = schemaEvidence.length > 0 ? schemaEvidence : manualGuardEvidence;
  const validationKind = schemaEvidence.length > 0
    ? "schema-parse"
    : manualGuardEvidence.length > 0
      ? "manual-guard"
      : "none";
  const ok = validationKind !== "none";
  return {
    method,
    usesJson: true,
    validationKind,
    evidenceLines: evidence.map((node) => lineOf(sourceFile, node)),
    bodyReadLines: bodyReads.map((node) => lineOf(sourceFile, node)),
    ok,
    details: ok
      ? `json-body-validated-by-${validationKind}`
      : "json-body-reaches-no-handler-local-validation",
  };
}

export function analyzeSourceText(sourceText, fileName = "route.ts") {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  return getMutationHandlers(sourceFile).map(({ method, node }) => analyzeHandler(sourceFile, method, node));
}

async function runSelfTests() {
  const expectedByFile = {
    "unvalidated.route.ts": { POST: false },
    "validated.route.ts": { POST: true },
    "mixed.route.ts": { POST: true, PATCH: false },
  };
  const results = [];
  for (const [fixtureName, expectedMethods] of Object.entries(expectedByFile)) {
    const sourceText = await fs.readFile(path.join(fixturesRoot, fixtureName), "utf8");
    const actual = analyzeSourceText(sourceText, fixtureName);
    for (const [method, expected] of Object.entries(expectedMethods)) {
      const analysis = actual.find((entry) => entry.method === method);
      const ok = Boolean(analysis) && analysis.ok === expected;
      results.push({
        fixture: fixtureName,
        method,
        expected,
        actual: analysis?.ok ?? null,
        validationKind: analysis?.validationKind ?? "missing-handler",
        ok,
      });
    }
  }
  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    throw new Error(`contract-audit self-test failed: ${JSON.stringify(failures)}`);
  }
  return results;
}

async function runRepositoryAudit() {
  const routeFiles = await listRouteFiles(apiRoot);
  const checks = [];
  for (const routeFile of routeFiles) {
    const content = await fs.readFile(routeFile, "utf8");
    for (const handler of analyzeSourceText(content, routeFile)) {
      checks.push({
        route: path.relative(process.cwd(), routeFile).replaceAll("\\", "/"),
        ...handler,
      });
    }
  }
  return checks;
}

async function main() {
  const selfTests = await runSelfTests();
  const checks = process.argv.includes("--self-test") ? [] : await runRepositoryAudit();
  const passCount = checks.filter((check) => check.ok).length;
  const failCount = checks.length - passCount;
  const report = {
    generatedAt: new Date().toISOString(),
    analysis: "typescript-ast-handler-local-taint",
    selfTestCount: selfTests.length,
    selfTestPassCount: selfTests.filter((test) => test.ok).length,
    totalChecked: checks.length,
    passCount,
    failCount,
    checks,
  };
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(
    `contract-audit: ${report.selfTestPassCount}/${report.selfTestCount} self-tests, ${passCount}/${checks.length} handlers passed`,
  );
  if (failCount > 0) {
    for (const check of checks.filter((entry) => !entry.ok)) {
      console.error(`contract-audit: ${check.route} ${check.method}: ${check.details}`);
    }
    process.exitCode = 1;
  }
}

const isMain = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMain) {
  main().catch((error) => {
    console.error("contract-audit failed:", error);
    process.exit(1);
  });
}
