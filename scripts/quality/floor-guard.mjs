#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const requestedBase = (() => {
  const index = process.argv.indexOf("--base");
  return index >= 0 ? process.argv[index + 1] : undefined;
})();
const base = requestedBase ?? process.env.QUALITY_BASE_REF ?? "origin/main";
const constraintChangeApproved =
  process.env.QUALITY_ALLOW_CONSTRAINT_CHANGE === "1";

function git(args, { allowDiff = false } = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (allowDiff && error.status === 1 && typeof error.stdout === "string") {
      return error.stdout;
    }
    return null;
  }
}

function abort(message) {
  console.error(`floor-guard: ${message}`);
  process.exit(2);
}

const root = git(["rev-parse", "--show-toplevel"])?.trim();
if (!root) abort("not inside a Git work tree");
process.chdir(root);

const mergeBase = git(["merge-base", base, "HEAD"])?.trim();
if (!mergeBase) abort(`no merge base against ${base}`);

const tracked = git(["diff", "--unified=0", mergeBase, "--"]);
if (tracked === null) abort(`could not diff against ${mergeBase}`);

const untrackedNames = git(["ls-files", "--others", "--exclude-standard"]);
if (untrackedNames === null) abort("could not list untracked files");

const emptyFile = process.platform === "win32" ? "NUL" : "/dev/null";
const isWorkspaceMetadata = (file) =>
  file.startsWith(".codex/") || file.startsWith(".agents/");
const untracked = untrackedNames
  .split("\n")
  .filter((file) => file && !isWorkspaceMetadata(file))
  .map((file) => {
    const result = git(["diff", "--no-index", "--unified=0", emptyFile, file], {
      allowDiff: true,
    });
    if (result === null) abort(`could not inspect untracked file ${file}`);
    return result;
  })
  .join("\n");

const added = [];
const removed = [];
const deleted = [];
let file = "";
let oldFile = "";
let inHeader = false;

for (const line of `${tracked}\n${untracked}`.split("\n")) {
  if (line.startsWith("diff ")) {
    inHeader = true;
  } else if (line.startsWith("@@")) {
    inHeader = false;
  } else if (inHeader && line.startsWith("--- ")) {
    oldFile = line.slice(4).replace(/^[ab]\//, "");
  } else if (inHeader && line.startsWith("+++ ")) {
    const newFile = line.slice(4).replace(/^[ab]\//, "");
    file = newFile === "/dev/null" ? oldFile : newFile;
    if (newFile === "/dev/null") deleted.push(file);
  } else if (!inHeader && line.startsWith("+")) {
    added.push({ file, text: line.slice(1) });
  } else if (!inHeader && line.startsWith("-")) {
    removed.push({ file, text: line.slice(1) });
  }
}

const findings = [];
const report = (rule, target, text) =>
  findings.push({ rule, file: target, text: text.trim().slice(0, 120) });
const isCode = (target) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(target);
const isTest = (target) =>
  /(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec)\./.test(target);
const isGuard = (target) => target === "scripts/quality/floor-guard.mjs";

const workflowDir = ".github/workflows";
if (existsSync(workflowDir)) {
  const workflowFiles = readdirSync(workflowDir).filter((name) =>
    /\.ya?ml$/.test(name),
  );
  for (const workflowFile of workflowFiles) {
    const workflowPath = `${workflowDir}/${workflowFile}`;
    const workflow = readFileSync(workflowPath, "utf8");
    for (const line of workflow.split(/\r?\n/)) {
      const action = line.match(/^\s*-?\s*uses:\s*([^\s#]+)\s*(?:#.*)?$/)?.[1];
      if (!action || action.startsWith("./")) continue;
      const separator = action.lastIndexOf("@");
      const reference = separator >= 0 ? action.slice(separator + 1) : "";
      if (!/^[a-f0-9]{40}$/.test(reference)) {
        report(
          "github-action-not-sha-pinned",
          workflowPath,
          `${action} must use an immutable 40-character commit SHA`,
        );
      }
    }
  }
}

for (const forbiddenLockfile of [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
]) {
  if (existsSync(forbiddenLockfile)) {
    report(
      "foreign-package-manager-lockfile",
      forbiddenLockfile,
      "pnpm is authoritative",
    );
  }
}

if (!existsSync("pnpm-lock.yaml")) {
  report(
    "missing-pnpm-lockfile",
    "pnpm-lock.yaml",
    "the authoritative lockfile is required",
  );
}

const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));
if (!String(packageManifest.packageManager ?? "").startsWith("pnpm@12.")) {
  report(
    "package-manager-drift",
    "package.json",
    "packageManager must pin pnpm 12",
  );
}

const directDependencies = {
  ...(packageManifest.dependencies ?? {}),
  ...(packageManifest.devDependencies ?? {}),
  ...(packageManifest.optionalDependencies ?? {}),
};
for (const [dependency, version] of Object.entries(directDependencies)) {
  if (String(version).trim().toLowerCase() === "latest") {
    report(
      "unbounded-direct-dependency",
      "package.json",
      `${dependency} must use an explicit version instead of latest`,
    );
  }
}

const nextVersion = packageManifest.dependencies?.next;
const nextPeers = {
  "@next/env": packageManifest.dependencies?.["@next/env"],
  "eslint-config-next": packageManifest.devDependencies?.["eslint-config-next"],
};
if (!/^\d+\.\d+\.\d+$/.test(String(nextVersion ?? ""))) {
  report(
    "next-version-not-exact",
    "package.json",
    "next must use an exact stable semantic version",
  );
}
for (const [dependency, version] of Object.entries(nextPeers)) {
  if (version !== nextVersion) {
    report(
      "next-package-version-drift",
      "package.json",
      `${dependency} (${version ?? "missing"}) must match next (${
        nextVersion ?? "missing"
      })`,
    );
  }
}

const suppressions =
  /@ts-ignore|@ts-nocheck|eslint-disable|istanbul ignore|nosemgrep|gitleaks:allow|Stryker disable/;
const unfinished =
  /throw new (?:Error|NotImplemented).*not implemented|catch\s*(?:\([^)]*\))?\s*\{\s*\}|\bTODO\b/i;
const skipped = /\.(?:skip|todo)\b|\bxit\(|\bxdescribe\(/;

for (const change of added) {
  if (
    !isCode(change.file) ||
    isGuard(change.file) ||
    isWorkspaceMetadata(change.file)
  )
    continue;
  if (suppressions.test(change.text))
    report("silenced-checker", change.file, change.text);
  if (unfinished.test(change.text))
    report("unfinished-work", change.file, change.text);
  if (isTest(change.file) && skipped.test(change.text)) {
    report("test-made-easier", change.file, change.text);
  }
}

for (const target of deleted) {
  if (isTest(target)) report("test-deleted", target, "file deleted");
}
for (const change of removed) {
  if (
    isTest(change.file) &&
    !deleted.includes(change.file) &&
    /\b(?:expect|assert|should)\b/.test(change.text)
  ) {
    report("assertion-removed", change.file, change.text);
  }
}

const constraintLines = (items) =>
  items.filter(
    (change) =>
      change.file === "CONSTRAINTS.md" &&
      (/^[-*] /.test(change.text.trim()) || change.text.trim().startsWith("|")),
  );
const ruleKey = (text) => {
  const value = text.trim();
  if (value.startsWith("|")) {
    return (
      value
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)[0] ?? ""
    );
  }
  return value.slice(2).split(":")[0].trim();
};
const oldRules = constraintLines(removed);
const newRules = constraintLines(added);

for (const oldRule of oldRules) {
  const replacement = newRules.find(
    (candidate) => ruleKey(candidate.text) === ruleKey(oldRule.text),
  );
  if (!replacement) {
    if (!constraintChangeApproved) {
      report("constraint-removed", oldRule.file, oldRule.text);
    }
  } else if (replacement.text !== oldRule.text && !constraintChangeApproved) {
    report(
      "constraint-changed-review-required",
      oldRule.file,
      `${oldRule.text} -> ${replacement.text}`,
    );
  }
}

for (const change of newRules) {
  if (
    !constraintChangeApproved &&
    /^\|\s*(?:W|E)\d+\s*\|/.test(change.text.trim())
  ) {
    report("new-exception-review-required", change.file, change.text);
  }
}

if (findings.length === 0) {
  console.log(`floor-guard: clean against ${base}`);
  process.exit(0);
}

console.error(`floor-guard: ${findings.length} blocking finding(s)`);
for (const finding of findings) {
  console.error(`  [${finding.rule}] ${finding.file}: ${finding.text}`);
}
console.error(
  "Fix the implementation or obtain an explicit, time-limited exception.",
);
process.exit(1);
