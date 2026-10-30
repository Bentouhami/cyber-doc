import fs from "node:fs/promises";
import path from "node:path";

export type StoredFileAccessErrorCode =
  | "INVALID_PATH"
  | "OUTSIDE_ROOT"
  | "SYMLINK"
  | "NOT_FOUND"
  | "NOT_FILE";

export class StoredFileAccessError extends Error {
  readonly code: StoredFileAccessErrorCode;

  constructor(code: StoredFileAccessErrorCode) {
    super("Stored file access denied");
    this.name = "StoredFileAccessError";
    this.code = code;
  }
}

function comparablePath(value: string) {
  const normalized = path.normalize(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function assertPathWithinRoot(
  realRoot: string,
  realTarget: string,
  options: { allowRoot?: boolean } = {},
) {
  const relative = path.relative(realRoot, realTarget);
  if (
    (!options.allowRoot && !relative) ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new StoredFileAccessError("OUTSIDE_ROOT");
  }
}

export function normalizeStoredRelativePath(storedPath: string) {
  const normalized = storedPath.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    normalized.includes(":") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new StoredFileAccessError("INVALID_PATH");
  }
  return normalized;
}

function stripLegacyPrefix(relativePath: string, prefix: string) {
  const normalizedPrefix = prefix.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  return relativePath.startsWith(`${normalizedPrefix}/`)
    ? relativePath.slice(normalizedPrefix.length + 1)
    : null;
}

export async function resolveOwnedStoredFile(options: {
  root: string;
  storedPath: string;
  legacyPrefixes?: string[];
}) {
  const normalized = normalizeStoredRelativePath(options.storedPath);
  const candidates = [
    normalized,
    ...(options.legacyPrefixes ?? []).flatMap((prefix) => {
      const stripped = stripLegacyPrefix(normalized, prefix);
      return stripped ? [normalizeStoredRelativePath(stripped)] : [];
    }),
  ];
  const realRoot = await fs.realpath(options.root).catch(() => {
    throw new StoredFileAccessError("NOT_FOUND");
  });

  for (const relativePath of Array.from(new Set(candidates))) {
    const candidate = path.resolve(realRoot, ...relativePath.split("/"));
    assertPathWithinRoot(realRoot, candidate);

    let stats;
    try {
      stats = await fs.lstat(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw new StoredFileAccessError("NOT_FOUND");
    }

    if (stats.isSymbolicLink()) {
      throw new StoredFileAccessError("SYMLINK");
    }

    const realTarget = await fs.realpath(candidate).catch(() => {
      throw new StoredFileAccessError("NOT_FOUND");
    });
    assertPathWithinRoot(realRoot, realTarget);
    if (comparablePath(candidate) !== comparablePath(realTarget)) {
      throw new StoredFileAccessError("SYMLINK");
    }

    const targetStats = await fs.stat(realTarget);
    if (!targetStats.isFile()) {
      throw new StoredFileAccessError("NOT_FILE");
    }
    return realTarget;
  }

  throw new StoredFileAccessError("NOT_FOUND");
}

export async function resolveSecureWritePath(root: string, storedPath: string) {
  const normalized = normalizeStoredRelativePath(storedPath);
  await fs.mkdir(root, { recursive: true });
  const realRoot = await fs.realpath(root);
  const candidate = path.resolve(realRoot, ...normalized.split("/"));
  assertPathWithinRoot(realRoot, candidate);

  const parent = path.dirname(candidate);
  await fs.mkdir(parent, { recursive: true });
  const realParent = await fs.realpath(parent);
  assertPathWithinRoot(realRoot, realParent, { allowRoot: true });
  if (comparablePath(parent) !== comparablePath(realParent)) {
    throw new StoredFileAccessError("SYMLINK");
  }

  try {
    const targetStats = await fs.lstat(candidate);
    if (targetStats.isSymbolicLink()) {
      throw new StoredFileAccessError("SYMLINK");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  return candidate;
}

export function safeDownloadFileName(value: string | null | undefined, fallback: string) {
  const baseName = value ? path.posix.basename(value.replaceAll("\\", "/")) : fallback;
  const sanitized = baseName.replace(/[\u0000-\u001f\u007f"\\/]/g, "_").trim();
  return sanitized || fallback;
}
