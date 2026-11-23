const INTERNAL_ORIGIN = "https://cyberdoc.invalid";

export function safeInternalRedirect(value: unknown, fallback = "/documents") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    return url.origin === INTERNAL_ORIGIN
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
