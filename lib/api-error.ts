import { NextResponse } from "next/server";

type ApiErrorContext = {
  route: string;
  operation: string;
};

const SAFE_FILESYSTEM_CODES = new Set([
  "EACCES",
  "EEXIST",
  "EISDIR",
  "ENOENT",
  "ENOSPC",
  "ENOTDIR",
  "EPERM",
]);

export function classifyApiError(error: unknown) {
  if (!error || typeof error !== "object") return "unknown";
  if (error instanceof SyntaxError) return "syntax";
  if (error instanceof RangeError) return "range";
  if (error instanceof TypeError) return "type";

  const name = "name" in error && typeof error.name === "string" ? error.name : "";
  if (name.startsWith("Prisma")) return "database";
  if (name === "StoredFileAccessError") return "storage_policy";

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  if (SAFE_FILESYSTEM_CODES.has(code)) return "filesystem";
  return "runtime";
}

export function createSafeApiErrorEvent(context: ApiErrorContext, error: unknown) {
  return {
    level: "error",
    event: "api_error",
    route: context.route,
    operation: context.operation,
    errorType: classifyApiError(error),
  } as const;
}

export function logApiError(context: ApiErrorContext, error: unknown) {
  console.error(JSON.stringify(createSafeApiErrorEvent(context, error)));
}

export function internalServerError(
  context: ApiErrorContext,
  error: unknown,
  publicMessage = "Internal Server Error",
) {
  logApiError(context, error);
  return NextResponse.json({ message: publicMessage }, { status: 500 });
}
