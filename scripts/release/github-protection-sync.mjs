#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const REQUIRED_CHECKS = [
  "Static, security and build gates",
  "Gitleaks secret scan",
  "Dependency review",
  "Production container targets",
  "Database and critical E2E gates",
];
const DEFAULT_BRANCHES = ["dev", "main"];
const APPLY_CONFIRMATION = "I_UNDERSTAND";

function parseArgs(argv) {
  const options = { apply: false, branches: [], repository: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      options.apply = true;
    } else if (argument === "--branch") {
      const branch = argv[index + 1];
      if (!branch) throw new Error("--branch requires a value");
      options.branches.push(branch);
      index += 1;
    } else if (argument === "--repository") {
      const repository = argv[index + 1];
      if (!repository) throw new Error("--repository requires owner/name");
      options.repository = repository;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function gh(args, input) {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8",
      input,
      maxBuffer: 10 * 1024 * 1024,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? "unknown error")
      .trim()
      .split(/\r?\n/, 1)[0];
    throw new Error(`gh ${args.join(" ")} failed: ${detail}`);
  }
}

function currentRepository() {
  const result = JSON.parse(gh(["repo", "view", "--json", "nameWithOwner"]));
  if (!result.nameWithOwner) throw new Error("GitHub repository identity is unavailable");
  return result.nameWithOwner;
}

function protection(repository, branch) {
  return JSON.parse(
    gh(["api", `repos/${repository}/branches/${branch}/protection`]),
  );
}

function contextsFrom(protectionState) {
  return protectionState.required_status_checks?.contexts ?? [];
}

function sameContexts(actual) {
  return (
    actual.length === REQUIRED_CHECKS.length &&
    REQUIRED_CHECKS.every((check) => actual.includes(check))
  );
}

const options = parseArgs(process.argv.slice(2));
const repository = currentRepository();
const branches = options.branches.length > 0 ? options.branches : DEFAULT_BRANCHES;

if (options.repository && options.repository !== repository) {
  throw new Error(
    `Repository mismatch: current repository is ${repository}, not ${options.repository}`,
  );
}

if (options.apply) {
  if (!options.repository) {
    throw new Error("--apply requires --repository owner/name");
  }
  if (process.env.CYBERDOC_GITHUB_PROTECTION_APPLY !== APPLY_CONFIRMATION) {
    throw new Error(
      `--apply requires CYBERDOC_GITHUB_PROTECTION_APPLY=${APPLY_CONFIRMATION}`,
    );
  }
}

let changed = 0;
for (const branch of branches) {
  const before = contextsFrom(protection(repository, branch));
  const needsChange = !sameContexts(before);
  console.log(`${branch}: ${needsChange ? "CHANGE REQUIRED" : "already compliant"}`);
  console.log(`  before: ${before.join(", ") || "(none)"}`);
  console.log(`  after:  ${REQUIRED_CHECKS.join(", ")}`);

  if (!needsChange || !options.apply) continue;

  gh(
    [
      "api",
      "--method",
      "PUT",
      "-H",
      "Accept: application/vnd.github+json",
      `repos/${repository}/branches/${branch}/protection/required_status_checks/contexts`,
      "--input",
      "-",
    ],
    JSON.stringify(REQUIRED_CHECKS),
  );

  const after = contextsFrom(protection(repository, branch));
  if (!sameContexts(after)) {
    throw new Error(`${branch}: post-apply verification failed`);
  }
  changed += 1;
  console.log(`  verified: ${branch} now requires the five current checks`);
}

if (options.apply) {
  console.log(`github-protection-sync: applied and verified ${changed} branch(es)`);
} else {
  console.log("github-protection-sync: dry run only; GitHub was not modified");
}
