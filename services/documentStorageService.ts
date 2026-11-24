import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import fs from "node:fs/promises";

import { del, get, head, put } from "@vercel/blob";

import {
  normalizeStoredRelativePath,
  resolveOwnedStoredFile,
  resolveSecureWritePath,
  StoredFileAccessError,
} from "@/services/storageSecurity";

const STORAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "storage",
);

export const BLOB_HEALTH_PATH = "_system/health";

export type DocumentStorageDriver = "local" | "vercel-blob";

export function getDocumentStorageDriver(): DocumentStorageDriver {
  const driver = process.env.DOCS_STORAGE_DRIVER?.trim() || "local";
  if (driver === "local" || driver === "vercel-blob") {
    return driver;
  }
  throw new Error(`Unsupported DOCS_STORAGE_DRIVER: ${driver}`);
}

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
  const normalizedPath = normalizeStoredRelativePath(relativePath);
  if (getDocumentStorageDriver() === "vercel-blob") {
    await put(normalizedPath, Buffer.from(buffer), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/pdf",
    });
    return normalizedPath;
  }

  const finalPath = await ensureStoragePath(normalizedPath);
  const stagingPath = await ensureStoragePath(
    `${normalizedPath}.${randomUUID()}.part`,
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

export async function readStoredFile(relativePath: string) {
  const normalizedPath = normalizeStoredRelativePath(relativePath);
  if (getDocumentStorageDriver() === "vercel-blob") {
    const result = await get(normalizedPath, { access: "private" });
    if (!result?.stream) {
      throw new StoredFileAccessError("NOT_FOUND");
    }
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  const absolutePath = await resolveOwnedStoredFile({
    root: resolveStorageRoot(),
    storedPath: normalizedPath,
    legacyPrefixes: ["storage"],
  });
  return fs.readFile(absolutePath);
}

export async function writeStoredFile(
  relativePath: string,
  buffer: Uint8Array,
  contentType: string,
) {
  const normalizedPath = normalizeStoredRelativePath(relativePath);
  if (getDocumentStorageDriver() === "vercel-blob") {
    await put(normalizedPath, Buffer.from(buffer), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType,
    });
    return normalizedPath;
  }

  const absolutePath = await ensureStoragePath(normalizedPath);
  await fs.writeFile(absolutePath, buffer, { flag: "wx" });
  return absolutePath;
}

export async function deleteStoredFile(relativePath: string) {
  const normalizedPath = normalizeStoredRelativePath(relativePath);
  if (getDocumentStorageDriver() === "vercel-blob") {
    await del(normalizedPath);
    return;
  }

  const absolutePath = await ensureStoragePath(normalizedPath);
  await fs.rm(absolutePath, { force: true });
}

export async function isDocumentStorageAvailable() {
  if (getDocumentStorageDriver() === "vercel-blob") {
    await head(BLOB_HEALTH_PATH);
    return;
  }

  await fs.access(resolveStorageRoot(), constants.R_OK | constants.W_OK);
}
