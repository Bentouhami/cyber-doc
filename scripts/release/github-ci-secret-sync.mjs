#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const REQUIRED_SECRET_NAMES = ["CI_DB_PASSWORD", "CI_BETTER_AUTH_SECRET"];
const APPLY_CONFIRMATION = "I_UNDERSTAND";

function parseArgs(argv) {
  const options = { apply: false, rotate: false, repository: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--rotate") options.rotate = true;
    else if (argument === "--repository") {
      const repository = argv[index + 1];
      if (!repository) throw new Error("--repository requires owner/name");
      options.repository = repository;
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.rotate && !options.apply) {
    throw new Error("--rotate is valid only together with --apply");
  }
  return options;
}

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

function secretNames(repository) {
  const inventory = JSON.parse(
    gh(["api", `repos/${repository}/actions/secrets`, "--paginate"]),
  );
  return new Set((inventory.secrets ?? []).map((secret) => secret.name));
}

function newUrlSafeSecret(byteCount) {
  return randomBytes(byteCount).toString("base64url");
}

function setSecret(repository, name, value) {
  const result = spawnSync("gh", ["secret", "set", name, "--repo", repository], {
    encoding: "utf8",
    input: value,
    maxBuffer: 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || "unknown error")
      .trim()
      .split(/\r?\n/, 1)[0];
    throw new Error(`Failed to configure ${name}: ${detail}`);
  }
}

const options = parseArgs(process.argv.slice(2));
const repository = JSON.parse(
  gh(["repo", "view", "--json", "nameWithOwner"]),
).nameWithOwner;
if (!repository) throw new Error("GitHub repository identity is unavailable");
if (options.repository && options.repository !== repository) {
  throw new Error(
    `Repository mismatch: current repository is ${repository}, not ${options.repository}`,
  );
}
if (options.apply) {
  if (!options.repository) throw new Error("--apply requires --repository owner/name");
  if (process.env.CYBERDOC_GITHUB_SECRET_APPLY !== APPLY_CONFIRMATION) {
    throw new Error(
      `--apply requires CYBERDOC_GITHUB_SECRET_APPLY=${APPLY_CONFIRMATION}`,
    );
  }
}

const before = secretNames(repository);
for (const name of REQUIRED_SECRET_NAMES) {
  const exists = before.has(name);
  const action = exists && !options.rotate ? "PRESENT (unchanged)" : exists ? "ROTATE" : "CREATE";
  console.log(`${name}: ${action}`);
}

if (!options.apply) {
  console.log("github-ci-secret-sync: dry run only; no value was generated or sent");
  process.exit(0);
}

for (const name of REQUIRED_SECRET_NAMES) {
  if (before.has(name) && !options.rotate) continue;
  let value = newUrlSafeSecret(name === "CI_BETTER_AUTH_SECRET" ? 48 : 32);
  try {
    setSecret(repository, name, value);
  } finally {
    value = undefined;
  }
  console.log(`${name}: configured (value not displayed)`);
}

const after = secretNames(repository);
const missing = REQUIRED_SECRET_NAMES.filter((name) => !after.has(name));
if (missing.length > 0) {
  throw new Error(`Post-apply verification failed for: ${missing.join(", ")}`);
}
console.log("github-ci-secret-sync: required names verified; values were not read");
