import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const outDir = path.join(cwd, "tmp", "e2e-critical");
const requestedBaseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const allowEpermSkip = process.env.SMOKE_ALLOW_EPERM_SKIP === "1";
const allowDbUnavailableSkip = process.env.SMOKE_ALLOW_DB_UNAVAILABLE_SKIP === "1";
const dbUnavailablePattern = /(P1001|Can't reach database server|DatabaseNotReachable)/i;

function runNodeScript(scriptPath, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
    child.on("error", (error) =>
      resolve({
        code: 1,
        output: error instanceof Error ? error.message : String(error),
      }),
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortAvailable(hostname, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ host: hostname, port, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function reserveSmokeBaseUrl() {
  const requested = new URL(requestedBaseURL);
  if (requested.protocol !== "http:" || requested.pathname !== "/") {
    throw new Error("SMOKE_BASE_URL must be a path-free HTTP loopback URL");
  }
  if (!["127.0.0.1", "localhost"].includes(requested.hostname)) {
    throw new Error("SMOKE_BASE_URL must use a loopback hostname");
  }

  const requestedPort = Number(requested.port || "80");
  const candidates = process.env.SMOKE_BASE_URL
    ? [requestedPort]
    : Array.from({ length: 20 }, (_, index) => requestedPort + index);
  for (const port of candidates) {
    if (await isPortAvailable(requested.hostname, port)) {
      return `http://${requested.hostname}:${port}`;
    }
  }
  throw new Error(
    process.env.SMOKE_BASE_URL
      ? `SMOKE_BASE_URL port ${requestedPort} is already in use`
      : "No isolated loopback port is available for the critical E2E server",
  );
}

async function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) {
        return true;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  return false;
}

async function run() {
  const baseURL = await reserveSmokeBaseUrl();
  const serverUrl = new URL(baseURL);
  const smokeDistDir = "tmp/next-smoke";
  const smokeDistPath = path.resolve(cwd, smokeDistDir);
  const tmpRoot = `${path.resolve(cwd, "tmp")}${path.sep}`;
  if (!smokeDistPath.startsWith(tmpRoot)) {
    throw new Error("Refusing to place the smoke build outside the project tmp directory");
  }
  await fs.rm(smokeDistPath, { recursive: true, force: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    allowEpermSkip,
    allowDbUnavailableSkip,
    suites: [],
    passCount: 0,
    failCount: 0,
    skipCount: 0,
  };

  await fs.mkdir(outDir, { recursive: true });

  const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
  const devProc = spawn(process.execPath, [
    nextBin,
    "dev",
    "--hostname",
    serverUrl.hostname,
    "--port",
    serverUrl.port,
  ], {
    cwd,
    env: { ...process.env, CYBERDOC_NEXT_DIST_DIR: smokeDistDir },
    stdio: "inherit",
  });

  try {
    const ready = await waitForServer(baseURL, 90000);
    if (!ready) {
      report.suites.push({
        name: "dev-server",
        ok: false,
        exitCode: 1,
        durationMs: 90000,
      });
      report.failCount += 1;
    } else {
      for (const suite of [
        { name: "permissions-smoke", script: "scripts/permissions-smoke-runner.mjs" },
        // The document suite creates disposable records used by the preview and
        // responsive-detail checks in the following suites.
        { name: "documents-smoke", script: "scripts/documents-smoke-runner.mjs" },
        { name: "admin-smoke", script: "scripts/admin-smoke-runner.mjs" },
        { name: "ux-route-check", script: "scripts/ux-route-check-runner.mjs" },
      ]) {
        const started = Date.now();
        const result = await runNodeScript(suite.script, { SMOKE_BASE_URL: baseURL });
        const code = result.code;
        const durationMs = Date.now() - started;
        const hasEperm = /spawn EPERM/i.test(result.output);
        const hasDbUnavailable = dbUnavailablePattern.test(result.output);
        const skipped =
          (allowEpermSkip && hasEperm) ||
          (allowDbUnavailableSkip && hasDbUnavailable);
        const ok = code === 0 || skipped;
        report.suites.push({
          name: suite.name,
          ok,
          skipped,
          exitCode: code,
          durationMs,
          reason: skipped
            ? hasDbUnavailable
              ? "Database unavailable in CI (allowed skip)"
              : "Playwright spawn EPERM (allowed skip)"
            : undefined,
        });
        if (skipped) {
          report.skipCount += 1;
        } else if (ok) {
          report.passCount += 1;
        } else {
          report.failCount += 1;
        }
      }
    }
  } finally {
    if (!devProc.killed) {
      if (process.platform === "win32" && devProc.pid) {
        spawnSync("taskkill", ["/PID", String(devProc.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else {
        devProc.kill("SIGTERM");
      }
    }
    await fs.rm(smokeDistPath, { recursive: true, force: true });
  }

  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(report, null, 2), "utf8");
  if (report.failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("e2e-critical-runner failed:", error);
  process.exitCode = 1;
});
