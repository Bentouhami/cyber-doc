# CyberDoc - Pre-Feature Discovery Checklist (DRY + KISS)

Use this checklist **before starting any feature/sub-feature**.

## A) Existing Implementation Scan

- [ ] Search UI routes/pages already covering this need.
- [ ] Search API handlers already covering this need.
- [ ] Search service/domain logic already covering this need.
- [ ] Search DB models/migrations already supporting this need.
- [ ] Search i18n keys already available.

Suggested commands:
- `rg --files app components lib prisma`
- `rg -n "<feature-keyword>" app components lib prisma locales`
- `rg -n "route\.ts|schema|zod|prisma|service" app lib`

## B) Reuse Decision (DRY)

- [ ] Reuse existing component(s) instead of creating new duplicates.
- [ ] Reuse existing validation schema or extend it safely.
- [ ] Reuse existing API contract unless change is required.
- [ ] Reuse existing translation keys if semantically correct.

Decision log (mandatory):
- Keep as-is / Extend / Replace
- Why
- Affected files

## C) Simplicity Gate (KISS)

- [ ] Can this be solved with the smallest possible change?
- [ ] Can we avoid adding a new dependency?
- [ ] Is the UI understandable for non-technical employees?
- [ ] Does this reduce steps instead of adding complexity?

## D) Contract and Data Impact

- [ ] Any Prisma schema change required?
- [ ] Any migration required?
- [ ] Any API payload/response change required?
- [ ] Backward compatibility checked.

## E) Done Definition Before Coding

- [ ] Exact acceptance criteria written (3-7 bullets).
- [ ] Test path defined (manual route checks + lint/type-check/build).
- [ ] i18n impact identified (FR + AR).

## F) Mandatory Output Before Implementation

Before coding, produce a short preflight note:
1. Current state found (already implemented / partial / not started)
2. Reuse plan (what will be reused)
3. Minimal change plan (files to touch)
4. Risks and rollback note

If this note is missing, implementation should not start.
