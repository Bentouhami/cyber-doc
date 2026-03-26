import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (
    !normalizedPath ||
    normalizedPath.startsWith("/") ||
    normalizedPath.includes("..")
  ) {
    throw new Error("Invalid storage path");
  }

  const storageRoot = resolveStorageRoot();
  const absolutePath = path.join(storageRoot, normalizedPath);
  const relativeFromRoot = path.relative(storageRoot, absolutePath);
  if (
    relativeFromRoot.startsWith("..") ||
    path.isAbsolute(relativeFromRoot)
  ) {
    throw new Error("Invalid storage path");
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
}
