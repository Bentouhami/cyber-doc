import { spawnSync } from "node:child_process";

const gitleaksArgs = [
  "--redact=100",
  "--no-banner",
  "--no-color",
  "--config",
  ".gitleaks.toml",
];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false,
    env: options.env ?? process.env,
  });
}

function gitleaksEnvironment() {
  const env = { ...process.env };
  const configuredCount = Number.parseInt(env.GIT_CONFIG_COUNT ?? "0", 10);
  const nextIndex = Number.isFinite(configuredCount) ? configuredCount : 0;
  env.GIT_CONFIG_COUNT = String(nextIndex + 1);
  env[`GIT_CONFIG_KEY_${nextIndex}`] = "core.autocrlf";
  env[`GIT_CONFIG_VALUE_${nextIndex}`] = "false";
  return env;
}

function git(args) {
  const result = run("git", args, { capture: true });
  return result.status === 0 ? result.stdout.trim() : "";
}

function assertGitleaksAvailable() {
  const version = run("gitleaks", ["version"], { capture: true });
  if (version.status === 0) {
    console.log(`[gitleaks] using ${version.stdout.trim()}.`);
    return;
  }

  console.error("[gitleaks] CLI not found. Install it before pushing:");
  console.error("  Windows: winget install --id Gitleaks.Gitleaks --exact");
  console.error("  macOS:   brew install gitleaks");
  console.error("  Linux:   https://github.com/gitleaks/gitleaks/releases");
  process.exit(1);
}

function scan(args, label) {
  console.log(`[gitleaks] ${label}`);
  const result = run("gitleaks", ["git", ".", ...args, ...gitleaksArgs], {
    env: gitleaksEnvironment(),
  });
  if (result.status !== 0) {
    console.error(`[gitleaks] ${label} failed. Treat every finding as a security incident.`);
    process.exit(result.status ?? 1);
  }
}

function findCommitRange() {
  const requestedBase = process.env.QUALITY_BASE_REF?.trim();
  const upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  const base = [requestedBase, upstream, "origin/main", "origin/dev", "HEAD^"]
    .filter(Boolean)
    .find((candidate) => git(["rev-parse", "--verify", candidate]));
  if (!base) {
    console.error("[gitleaks] no safe Git base could be resolved for the commit scan.");
    process.exit(1);
  }

  const mergeBase = git(["merge-base", "HEAD", base]);
  if (!mergeBase) return "";
  const range = `${mergeBase}..HEAD`;
  return git(["rev-list", "--count", range]) === "0" ? "" : range;
}

if (process.env.GITLEAKS_ALREADY_RUN === "1") {
  console.log("[gitleaks] official GitHub Action scan already passed for this CI job.");
  process.exit(0);
}

assertGitleaksAvailable();

const commitRange = findCommitRange();
if (commitRange) {
  scan([`--log-opts=${commitRange}`], `scanning unpushed commits (${commitRange})...`);
} else {
  console.log("[gitleaks] no unpushed commits to scan.");
}

scan(["--pre-commit"], "scanning tracked working-tree changes...");
console.log("[gitleaks] no secrets found in unpushed commits or tracked changes.");
