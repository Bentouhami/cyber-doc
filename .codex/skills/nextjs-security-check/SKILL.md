---
name: nextjs-security-check
description: Review Next.js security practices including CSP headers, image domain safety, environment variable exposure, and auth checks. Use when asked to audit or validate security for routes, API handlers, or app configuration.
---

# Next.js Security Check

Use this skill when a user requests a security review of Next.js routes, API handlers, or app configuration.

## Triggering phrases

- "Run security check on this route"
- "Evaluate auth handling in this Next.js API route"
- "Review CSP headers for this app"
- "Audit environment variable usage in Next.js"

## Instructions

1. Inspect `next.config.*` and middleware for security headers (CSP, HSTS, X-Frame-Options).
2. Validate `images.domains` and `remotePatterns` for safe, minimal allowlists.
3. Check environment variable usage for client exposure (`NEXT_PUBLIC_`).
4. Review API routes or server actions for auth/authorization checks.
5. Look for unsafe redirects, open redirects, or unsanitized input handling.
6. Provide actionable fixes with file paths and safe defaults.

## Checks

- CSP headers: prefer nonce or strict-dynamic, avoid overly broad `unsafe-inline`.
- Image domains: only allow required domains and paths.
- Secrets: never leak server secrets to client bundles.
- Auth: require session checks on protected routes and actions.

## Example output

```md
Security findings:
- `next.config.ts`: Missing CSP header; add a `headers()` policy for routes.
- `app/api/upload/route.ts`: No auth check before handling uploads.
- `next.config.ts`: `images.domains` includes `*`; replace with specific domains.
```
