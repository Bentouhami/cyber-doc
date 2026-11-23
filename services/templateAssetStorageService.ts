import path from "node:path";

import { resolveStorageRoot } from "@/services/documentStorageService";
import {
  normalizeStoredRelativePath,
  resolveOwnedStoredFile,
  resolveSecureWritePath,
} from "@/services/storageSecurity";

const PERSISTENT_PREFIXES = ["template-assets/", "template-requests/"];
const LEGACY_TEMPLATE_ASSETS_ROOT = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "templates_docs",
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
    root: LEGACY_TEMPLATE_ASSETS_ROOT,
    storedPath,
    legacyPrefixes: ["templates_docs"],
  });
}
