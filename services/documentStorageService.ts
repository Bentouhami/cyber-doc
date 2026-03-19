import fs from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export function resolveStorageRoot() {
  const storageDir = process.env.DOCS_STORAGE_DIR;
  if (storageDir && path.isAbsolute(storageDir)) {
    return storageDir;
  }
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

  const absolutePath = path.join(STORAGE_ROOT, normalizedPath);
  const relativeFromRoot = path.relative(STORAGE_ROOT, absolutePath);
  if (
    relativeFromRoot.startsWith("..") ||
    path.isAbsolute(relativeFromRoot)
  ) {
    throw new Error("Invalid storage path");
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
}
