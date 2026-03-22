import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string) {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const securityHeaders = [
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https:",
        "connect-src 'self' https: ws: wss:",
      ].join("; "),
    },
  ];

  if (!isDev) {
    securityHeaders.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return {
    experimental: {
      turbopackFileSystemCacheForDev: true,
      ...(isDev
        ? {}
        : {
            // Stabilize CI/local production builds on Windows where process spawning can fail.
            webpackBuildWorker: false,
            turbopackPluginRuntimeStrategy: "workerThreads" as const,
            workerThreads: true,
            cpus: 1,
          }),
    },
    outputFileTracingExcludes: {
      "/api/documents/generate": ["./next.config.ts"],
      "/api/documents/[documentId]/download": ["./next.config.ts"],
    },
    async headers() {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
      ];
    },
  };
}
