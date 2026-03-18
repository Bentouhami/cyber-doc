---
name: cyberdoc-auth-session-network
description: Audit and document auth/session/network behavior for Next.js fullstack (App Router, route handlers, auth middleware, cookies/session refresh).
metadata:
  short-description: Next.js fullstack auth/session/network diagnostics
---

## Purpose

Run a consistent diagnostics workflow for authentication, session lifecycle, and network behavior in a Next.js fullstack codebase.

## When to use

- Session issues, refresh loops, expired cookie behavior.
- Middleware/route handler auth regressions.
- CORS, fetch, proxy, or API client failures impacting auth.

## Workflow (concise)

1) Read the reference guide.
2) Identify touchpoints in middleware, `app/api/**/route.ts`, auth provider/client, and API fetch utilities.
3) Trace request lifecycle: browser -> middleware -> route handler -> data layer -> response.
4) Produce findings, concrete fixes, and risk notes.
5) Document in `/docs` (no secrets).

## References

See `references/workflow-summary.md`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Findings scoped to auth/session/network.
- [ ] No secrets in outputs.
- [ ] Documentation target identified in `/docs`.
