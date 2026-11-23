#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  REQUIRED_LABEL,
  evaluateQualityLabel,
  resolvePullRequestNumber,
} from "./github-quality-label-policy.mjs";

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

function currentBranch() {
  return execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repository = JSON.parse(
    gh(["repo", "view", "--json", "nameWithOwner"]),
  ).nameWithOwner;
  const labels = JSON.parse(
    gh(["label", "list", "--repo", repository, "--limit", "100", "--json", "name"]),
  );
  const labelExists = labels.some((label) => label.name === REQUIRED_LABEL);

  let pullRequestNumber = options.pullRequest;
  if (!pullRequestNumber) {
    const branch = currentBranch();
    const matches = JSON.parse(
      gh([
        "pr",
        "list",
        "--repo",
        repository,
        "--head",
        branch,
        "--state",
        "open",
        "--limit",
        "2",
        "--json",
        "number",
      ]),
    );
    pullRequestNumber = resolvePullRequestNumber(matches, branch);
  }
  const pullRequest = JSON.parse(
    gh([
      "pr",
      "view",
      String(pullRequestNumber),
      "--repo",
      repository,
      "--json",
      "labels,number,state,url",
    ]),
  );
  const findings = evaluateQualityLabel(labelExists, pullRequest);

  if (findings.length > 0) {
    console.error(`github-quality-label-check: ${findings.length} blocking finding(s)`);
    for (const finding of findings) console.error(`  - ${finding}`);
    process.exit(1);
  }

  console.log(
    `github-quality-label-check: '${REQUIRED_LABEL}' exists and is applied to PR #${pullRequest.number}`,
  );
}

try {
  main();
} catch (error) {
  console.error(
    `github-quality-label-check: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
