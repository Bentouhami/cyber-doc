import path from "node:path";
import fs from "node:fs/promises";

import {
  deleteStoredFile,
  readStoredFile,
  resolveStorageRoot,
  writeStoredFile,
} from "@/services/documentStorageService";
import {
  normalizeStoredRelativePath,
  resolveOwnedStoredFile,
  resolveSecureWritePath,
} from "@/services/storageSecurity";

const PERSISTENT_PREFIXES = ["template-assets/", "template-requests/"];
const PACKAGED_TEMPLATE_ASSETS_ROOT = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "templates_docs",
  "sanitized",
);

export function isPersistentTemplateAssetPath(storedPath: string) {
  const normalized = normalizeStoredRelativePath(storedPath);
  return PERSISTENT_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function buildUploadedTemplateAssetPath(fileName: string) {
  return path.posix.join("template-assets", fileName);
}

export function ensureUploadedTemplateAssetPath(storedPath: string) {
  if (!isPersistentTemplateAssetPath(storedPath)) {
    throw new Error("Uploaded template assets must use persistent storage");
  }
  return resolveSecureWritePath(resolveStorageRoot(), storedPath);
}

export function resolveTemplateAssetFile(storedPath: string) {
  if (isPersistentTemplateAssetPath(storedPath)) {
    return resolveOwnedStoredFile({
      root: resolveStorageRoot(),
      storedPath,
    });
  }
  return resolveOwnedStoredFile({
    root: PACKAGED_TEMPLATE_ASSETS_ROOT,
    storedPath,
    legacyPrefixes: ["templates_docs/sanitized"],
  });
}

export async function readTemplateAssetFile(storedPath: string) {
  if (isPersistentTemplateAssetPath(storedPath)) {
    return readStoredFile(storedPath);
  }
  return fs.readFile(await resolveTemplateAssetFile(storedPath));
}

export function writeUploadedTemplateAsset(storedPath: string, buffer: Uint8Array) {
  if (!isPersistentTemplateAssetPath(storedPath)) {
    throw new Error("Uploaded template assets must use persistent storage");
  }
  return writeStoredFile(
    storedPath,
    buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
}

export function deleteUploadedTemplateAsset(storedPath: string) {
  if (!isPersistentTemplateAssetPath(storedPath)) {
    throw new Error("Uploaded template assets must use persistent storage");
  }
  return deleteStoredFile(storedPath);
}
