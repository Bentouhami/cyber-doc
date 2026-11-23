export function buildApplicationContentSecurityPolicy(
  nonce: string,
  isDevelopment: boolean,
) {
  if (!/^[A-Za-z0-9_-]+$/.test(nonce)) {
    throw new Error("Invalid CSP nonce");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " http: https: ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
