#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const branches = process.argv.slice(2).filter(Boolean);
const requiredBranches = branches.length > 0 ? branches : ["dev", "main"];
const requiredChecks = [
  "Static, security and build gates",
  "Gitleaks secret scan",
  "Dependency review",
  "Production container targets",
  "Database and critical E2E gates",
];
const obsoleteChecks = new Set(["Frontend CI", "Backend CI"]);

function gh(args) {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? "unknown error")
      .trim()
      .split(/\r?\n/, 1)[0];
    throw new Error(`gh ${args.join(" ")} failed: ${detail}`);
  }
}

const repository = JSON.parse(
  gh(["repo", "view", "--json", "nameWithOwner"]),
).nameWithOwner;
if (!repository) throw new Error("GitHub repository identity is unavailable");

const findings = [];

for (const branch of requiredBranches) {
  let protection;
  try {
    protection = JSON.parse(
      gh(["api", `repos/${repository}/branches/${branch}/protection`]),
    );
  } catch (error) {
    findings.push(`${branch}: ${error.message}`);
    continue;
  }

  const contexts = new Set(protection.required_status_checks?.contexts ?? []);
  for (const check of requiredChecks) {
    if (!contexts.has(check)) findings.push(`${branch}: missing required check '${check}'`);
  }
  for (const check of contexts) {
    if (obsoleteChecks.has(check)) findings.push(`${branch}: obsolete required check '${check}'`);
  }

  const approvals =
    protection.required_pull_request_reviews?.required_approving_review_count ?? 0;
  if (approvals < 1) findings.push(`${branch}: at least one approval is required`);
  if (protection.enforce_admins?.enabled !== true) {
    findings.push(`${branch}: administrators are not subject to protection`);
  }
  if (protection.allow_force_pushes?.enabled !== false) {
    findings.push(`${branch}: force pushes are not explicitly disabled`);
  }
  if (protection.allow_deletions?.enabled !== false) {
    findings.push(`${branch}: branch deletion is not explicitly disabled`);
  }
}

if (findings.length > 0) {
  console.error(`github-protection-check: ${findings.length} blocking finding(s)`);
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}

console.log(
  `github-protection-check: ${requiredBranches.join(", ")} enforce all ${requiredChecks.length} current checks`,
);
