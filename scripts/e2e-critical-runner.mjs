import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const outDir = path.join(cwd, "tmp", "e2e-critical");
const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const allowEpermSkip = process.env.SMOKE_ALLOW_EPERM_SKIP === "1";

const suites = [
  {
    name: "permissions-smoke",
    command:
      "$proc = Start-Process -FilePath npm.cmd -ArgumentList 'run','dev' -PassThru -WindowStyle Hidden; Start-Sleep -Seconds 8; node scripts/permissions-smoke-runner.mjs; $code = $LASTEXITCODE; if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }; exit $code",
  },
  {
    name: "admin-smoke",
    command:
      "$proc = Start-Process -FilePath npm.cmd -ArgumentList 'run','dev' -PassThru -WindowStyle Hidden; Start-Sleep -Seconds 12; node scripts/admin-smoke-runner.mjs; $code = $LASTEXITCODE; if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }; exit $code",
  },
  {
    name: "documents-smoke",
    command:
      "$proc = Start-Process -FilePath npm.cmd -ArgumentList 'run','dev' -PassThru -WindowStyle Hidden; Start-Sleep -Seconds 10; node scripts/documents-smoke-runner.mjs; $code = $LASTEXITCODE; if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }; exit $code",
  },
  {
    name: "ux-route-check",
    command:
      "$proc = Start-Process -FilePath npm.cmd -ArgumentList 'run','dev' -PassThru -WindowStyle Hidden; Start-Sleep -Seconds 10; node scripts/ux-route-check-runner.mjs; $code = $LASTEXITCODE; if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }; exit $code",
  },
];

function runPowerShellCommand(command) {
  return new Promise((resolve) => {
    let pwsh;
    try {
      pwsh = spawn("pwsh", ["-Command", command], {
        cwd,
        env: { ...process.env, SMOKE_BASE_URL: baseURL },
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      resolve({ code: 1, output: message });
      return;
    }

    let output = "";
    pwsh.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    pwsh.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    pwsh.on("exit", (code) => resolve({ code: code ?? 1, output }));
    pwsh.on("error", () => resolve({ code: 1, output }));
  });
}

function runNodeScript(scriptPath, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    allowEpermSkip,
    suites: [],
    passCount: 0,
    failCount: 0,
    skipCount: 0,
  };

  await fs.mkdir(outDir, { recursive: true });

  if (process.platform === "win32") {
    for (const suite of suites) {
      const started = Date.now();
      const result = await runPowerShellCommand(suite.command);
      const code = result.code;
      const durationMs = Date.now() - started;
      const hasEperm = /spawn EPERM/i.test(result.output);
      const skipped = allowEpermSkip && hasEperm;
      const ok = code === 0 || skipped;
      report.suites.push({
        name: suite.name,
        ok,
        skipped,
        exitCode: code,
        durationMs,
        reason: skipped ? "Playwright spawn EPERM (allowed skip)" : undefined,
      });
      if (skipped) {
        report.skipCount += 1;
      } else if (ok) {
        report.passCount += 1;
      } else {
        report.failCount += 1;
      }
    }
  } else {
    const devProc = spawn(npmCmd, ["run", "dev"], {
      cwd,
      env: process.env,
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
          { name: "admin-smoke", script: "scripts/admin-smoke-runner.mjs" },
          { name: "documents-smoke", script: "scripts/documents-smoke-runner.mjs" },
          { name: "ux-route-check", script: "scripts/ux-route-check-runner.mjs" },
        ]) {
          const started = Date.now();
          const code = await runNodeScript(suite.script, { SMOKE_BASE_URL: baseURL });
          const durationMs = Date.now() - started;
          const ok = code === 0;
          report.suites.push({
            name: suite.name,
            ok,
            exitCode: code,
            durationMs,
          });
          if (ok) {
            report.passCount += 1;
          } else {
            report.failCount += 1;
          }
        }
      }
    } finally {
      if (!devProc.killed) {
        devProc.kill("SIGTERM");
      }
    }
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
