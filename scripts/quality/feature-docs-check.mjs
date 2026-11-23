#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const requestedBase = (() => {
  const index = process.argv.indexOf("--base");
  return index >= 0 ? process.argv[index + 1] : undefined;
})();
const base = requestedBase ?? process.env.QUALITY_BASE_REF ?? "origin/main";

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function abort(message) {
  console.error(`feature-docs-check: ${message}`);
  process.exit(2);
}

const root = git(["rev-parse", "--show-toplevel"])?.trim();
if (!root) abort("not inside a Git work tree");
process.chdir(root);

const mergeBase = git(["merge-base", base, "HEAD"])?.trim();
if (!mergeBase) abort(`no merge base against ${base}`);

const changedOutput = git(["diff", "--name-only", mergeBase, "--"]);
const untrackedOutput = git(["ls-files", "--others", "--exclude-standard"]);
if (changedOutput === null || untrackedOutput === null) {
  abort("could not inspect the working tree");
}

const changedFiles = new Set(
  `${changedOutput}\n${untrackedOutput}`
    .split("\n")
    .map((file) => file.trim().replaceAll("\\", "/"))
    .filter(Boolean),
);

const behaviorRoots = ["app/", "components/", "hooks/", "lib/", "services/"];
const behaviorChanged = [...changedFiles].some(
  (file) =>
    behaviorRoots.some((rootPath) => file.startsWith(rootPath)) ||
    file === "prisma/schema.prisma" ||
    file.startsWith("prisma/migrations/"),
);
const changedFeatureDocs = [...changedFiles].filter(
  (file) =>
    file.startsWith("docs/features/") &&
    file.endsWith(".md") &&
    !file.endsWith("/README.md") &&
    !file.endsWith("/_template.md"),
);

const featureDirectory = path.join(root, "docs", "features");
if (!fs.existsSync(featureDirectory)) {
  console.error("feature-docs-check: docs/features is missing");
  process.exit(1);
}

const featureFiles = fs
  .readdirSync(featureDirectory)
  .filter(
    (file) =>
      file.endsWith(".md") && !["README.md", "_template.md"].includes(file),
  )
  .sort();
const index = fs.readFileSync(path.join(featureDirectory, "README.md"), "utf8");
const requiredMetadata = ["id", "title", "status", "owners", "last-reviewed"];
const requiredSections = [
  "Résumé",
  "Périmètre utilisateur",
  "Règles métier",
  "Architecture et données",
  "API et contrats",
  "Permissions et sécurité",
  "Erreurs et cas limites",
  "Tests et preuves",
  "Exploitation",
  "Historique",
];
const findings = [];

for (const file of featureFiles) {
  const relativePath = `docs/features/${file}`;
  const content = fs.readFileSync(path.join(featureDirectory, file), "utf8");
  for (const key of requiredMetadata) {
    if (!new RegExp(`^${key}:\\s*\\S`, "m").test(content)) {
      findings.push(`${relativePath}: metadata '${key}' is missing`);
    }
  }
  for (const section of requiredSections) {
    if (!content.includes(`## ${section}`)) {
      findings.push(`${relativePath}: section '${section}' is missing`);
    }
  }
  if (!index.includes(`(${file})`)) {
    findings.push(`docs/features/README.md: missing index link to ${file}`);
  }
}

if (behaviorChanged && changedFeatureDocs.length === 0) {
  findings.push(
    "product behavior changed without updating a canonical file in docs/features/",
  );
}

if (findings.length > 0) {
  console.error(`feature-docs-check: ${findings.length} blocking finding(s)`);
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}

console.log(
  `feature-docs-check: ${featureFiles.length} feature document(s) valid; ${changedFeatureDocs.length} updated in this change`,
);
