#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const REQUIRED_LABEL = "quality-contract-change-approved";

function parseArgs(argv) {
  const options = { pullRequest: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--pr") throw new Error(`Unknown argument: ${argv[index]}`);
    const value = Number(argv[index + 1]);
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error("--pr requires a positive integer");
    }
    options.pullRequest = value;
    index += 1;
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

const options = parseArgs(process.argv.slice(2));
const repository = JSON.parse(
  gh(["repo", "view", "--json", "nameWithOwner"]),
).nameWithOwner;
const labels = JSON.parse(
  gh(["label", "list", "--repo", repository, "--limit", "100", "--json", "name"]),
);
const labelExists = labels.some((label) => label.name === REQUIRED_LABEL);
const findings = [];
if (!labelExists) findings.push(`repository label '${REQUIRED_LABEL}' does not exist`);

if (options.pullRequest) {
  const pullRequest = JSON.parse(
    gh([
      "pr",
      "view",
      String(options.pullRequest),
      "--repo",
      repository,
      "--json",
      "labels,number,url",
    ]),
  );
  const applied = (pullRequest.labels ?? []).some((label) => label.name === REQUIRED_LABEL);
  if (!applied) findings.push(`PR #${pullRequest.number} lacks '${REQUIRED_LABEL}'`);
}

if (findings.length > 0) {
  console.error(`github-quality-label-check: ${findings.length} blocking finding(s)`);
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}

console.log(`github-quality-label-check: '${REQUIRED_LABEL}' exists and is applied`);
