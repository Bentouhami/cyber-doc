import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

import { resolveSecureWritePath } from "@/services/storageSecurity";

const STORAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "storage",
);

export function resolveStorageRoot() {
  const rawStorageDir = process.env.DOCS_STORAGE_DIR?.trim();
  if (!rawStorageDir) {
    return STORAGE_ROOT;
  }

  // Keep container defaults from breaking local Windows development.
  if (process.platform === "win32" && rawStorageDir.startsWith("/")) {
    return STORAGE_ROOT;
  }

  if (path.isAbsolute(rawStorageDir)) {
    return rawStorageDir;
  }

  // Keep runtime tracing static for Turbopack/NFT: only absolute overrides are supported.
  return STORAGE_ROOT;
}

export function buildDocumentStoragePath(fileName: string) {
  return path.posix.join("documents", fileName);
}

export async function ensureStoragePath(relativePath: string) {
  return resolveSecureWritePath(resolveStorageRoot(), relativePath);
}

export async function writeDocumentFileAtomically(
  relativePath: string,
  buffer: Uint8Array,
) {
  const finalPath = await ensureStoragePath(relativePath);
  const stagingPath = await ensureStoragePath(
    `${relativePath}.${randomUUID()}.part`,
  );

  try {
    await fs.writeFile(stagingPath, buffer, { flag: "wx" });
    await fs.rename(stagingPath, finalPath);
    return finalPath;
  } catch (error) {
    await fs.unlink(stagingPath).catch(() => undefined);
    throw error;
  }
}
