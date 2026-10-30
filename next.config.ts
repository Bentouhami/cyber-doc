import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { PREVIEW_SECURITY_HEADERS } from "./lib/preview-security-headers";

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
  ];

  if (!isDev) {
    securityHeaders.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return {
    // The production container copies Next.js' minimal standalone runtime.
    output: "standalone",
    allowedDevOrigins: ["127.0.0.1"],
    experimental: {
      turbopackFileSystemCacheForDev: true,
      ...(isDev
        ? {}
        : {
            // Stabilize CI/local production builds on Windows where process spawning can fail.
            webpackBuildWorker: false,
            cpus: 1,
          }),
    },
    outputFileTracingIncludes: {
      "/api/templates/*/asset": ["./templates_docs/**/*"],
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
        {
          // The final matching rule wins in Next.js 16. Keep document previews
          // stricter than the application-wide policy that supports app scripts.
          source: "/api/documents/:documentId/preview",
          headers: Object.entries(PREVIEW_SECURITY_HEADERS).map(([key, value]) => ({
            key,
            value,
          })),
        },
      ];
    },
  };
}
