#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const REQUIRED_SECRET_NAMES = ["CI_DB_PASSWORD", "CI_BETTER_AUTH_SECRET"];

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

const response = JSON.parse(
  gh(["api", `repos/${repository}/actions/secrets`, "--paginate"]),
);
const configured = new Set((response.secrets ?? []).map((secret) => secret.name));
const missing = REQUIRED_SECRET_NAMES.filter((name) => !configured.has(name));

if (missing.length > 0) {
  console.error(
    `github-ci-secret-check: ${missing.length} required secret name(s) missing`,
  );
  for (const name of missing) console.error(`  - ${name}`);
  console.error("Secret values were not read and are not available through this API.");
  process.exit(1);
}

console.log(
  `github-ci-secret-check: all ${REQUIRED_SECRET_NAMES.length} required secret names exist`,
);
console.log("Secret values were not read.");
