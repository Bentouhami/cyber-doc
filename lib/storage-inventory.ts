export function classifyDocumentStoragePath(filePath: string | null) {
  if (!filePath) return "missing";
  if (filePath.startsWith("documents/")) return "documents";
  if (filePath.startsWith("storage/documents/")) return "legacy-storage-documents";
  return "other";
}

export function classifyTemplateAssetPath(filePath: string) {
  if (filePath.startsWith("template-assets/")) return "uploaded-template-assets";
  if (filePath.startsWith("template-requests/")) return "legacy-template-requests";
  if (filePath.startsWith("templates_docs/sanitized/")) return "packaged-sanitized-assets";
  return "other";
}

export function countStorageBuckets(
  values: Array<string | null>,
  classify: (value: string | null) => string,
) {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const bucket = classify(value);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }
  return counts;
}
