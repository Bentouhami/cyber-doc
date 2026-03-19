---
name: cyberdoc-rfc7807-audit
description: Audit and standardize API errors to RFC7807 across Next.js route handlers and frontend clients.
metadata:
  short-description: RFC7807 audit and standardization wrapper
---

## Purpose

Run a consistent RFC7807 audit workflow for Next.js fullstack APIs and provide compliant fixes.

## When to use

- API error handling reviews.
- Standardization of Problem Details responses.

## Workflow (concise)

1) Read the reference guide.
2) Map route handlers and frontend entry points.
3) Identify non-RFC7807 responses.
4) Propose minimal patches and tests.
5) Document changes under `/docs`.

## References

See `references/workflow-summary.md`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Non-RFC7807 endpoints identified.
- [ ] Patch proposal and tests defined.
- [ ] Documentation update target identified in `/docs`.
