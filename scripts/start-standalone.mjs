import { spawn } from "node:child_process";
import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");
const serverPath = path.join(standaloneRoot, "server.js");

async function copyIfPresent(source, destination) {
  try {
    await access(source);
  } catch {
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

async function run() {
  try {
    await access(serverPath);
  } catch {
    throw new Error(
      "Standalone build not found. Run `pnpm run build` before `pnpm start`.",
    );
  }

  await copyIfPresent(
    path.join(root, "public"),
    path.join(standaloneRoot, "public"),
  );
  await copyIfPresent(
    path.join(root, ".next", "static"),
    path.join(standaloneRoot, ".next", "static"),
  );

  const server = spawn(process.execPath, [serverPath], {
    cwd: standaloneRoot,
    env: process.env,
    stdio: "inherit",
  });

  server.on("error", (error) => {
    console.error("Unable to start the standalone server:", error.message);
    process.exitCode = 1;
  });

  server.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 1;
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
