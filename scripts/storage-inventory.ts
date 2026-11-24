import { loadEnvConfig } from "@next/env";
import type { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import {
  classifyDocumentStoragePath,
  classifyTemplateAssetPath,
  countStorageBuckets,
} from "../lib/storage-inventory";
import { resolveStorageRoot } from "../services/documentStorageService";
import { resolveOwnedStoredFile } from "../services/storageSecurity";

async function main(prisma: PrismaClient) {
  const [documents, templateAssets] = await Promise.all([
    prisma.document.findMany({ select: { filePath: true } }),
    prisma.templateAsset.findMany({ select: { filePath: true } }),
  ]);
  const referencedDocumentPaths = [
    ...new Set(documents.flatMap(({ filePath }) => filePath ? [filePath] : [])),
  ];
  const localReferenceChecks = await Promise.all(
    referencedDocumentPaths.map((filePath) =>
      resolveOwnedStoredFile({
        root: resolveStorageRoot(),
        storedPath: filePath,
        legacyPrefixes: ["storage"],
      }).then(() => true, () => false),
    ),
  );
  const localDirectoryEntries = await fs.readdir(
    path.join(resolveStorageRoot(), "documents"),
    { withFileTypes: true },
  ).catch(() => []);
  const localFileCount = localDirectoryEntries.filter((entry) => entry.isFile()).length;
  const referencedLocalFiles = localReferenceChecks.filter(Boolean).length;

  console.log(JSON.stringify({
    documents: countStorageBuckets(
      documents.map(({ filePath }) => filePath),
      classifyDocumentStoragePath,
    ),
    templateAssets: countStorageBuckets(
      templateAssets.map(({ filePath }) => filePath),
      (filePath) => classifyTemplateAssetPath(filePath ?? ""),
    ),
    localDocuments: {
      referenced: referencedDocumentPaths.length,
      present: referencedLocalFiles,
      missing: referencedDocumentPaths.length - referencedLocalFiles,
      directoryFiles: localFileCount,
      unreferencedCandidates: Math.max(0, localFileCount - referencedLocalFiles),
    },
  }, null, 2));
}

async function run() {
  loadEnvConfig(process.cwd());
  const { default: prisma } = await import("../lib/prisma");
  try {
    await main(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
    const details = error && typeof error === "object"
      ? {
          name: error instanceof Error ? error.name : "UnknownError",
          code: "code" in error ? String(error.code) : undefined,
          databaseCode:
            "meta" in error && error.meta && typeof error.meta === "object" && "code" in error.meta
              ? String(error.meta.code)
              : undefined,
        }
      : { name: "UnknownError" };
    console.error("Storage inventory failed", details);
    process.exitCode = 1;
});
