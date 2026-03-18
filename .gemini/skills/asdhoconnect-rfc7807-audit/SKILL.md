---
name: asdhoconnect-rfc7807-audit
description: Audit and standardize API errors to RFC7807 across backend and frontend.
metadata:
  short-description: RFC7807 audit and standardization wrapper
---

## Purpose

Run the RFC7807 audit workflow defined in the existing prompt and provide compliant fixes.

## When to use

- API error handling reviews.
- Standardization of Problem Details responses.

## Workflow (concise)

1) Read the reference guide.
2) Map backend and frontend entry points.
3) Identify non-RFC7807 responses.
4) Propose minimal patches and tests.
5) Document changes under /Documentation.

## References

See `references/workflow-summary.md` and `.codex/prompts/api/asdho_api_errors_audit.md`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Non-RFC7807 endpoints identified.
- [ ] Patch proposal and tests defined.
- [ ] Documentation update target identified.
