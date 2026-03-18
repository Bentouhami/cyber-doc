---
name: cyberdoc-contract-validator
description: Validate data contracts across Zod schemas, Next.js route handlers, Prisma models, service DTOs, and TypeScript types.
metadata:
  short-description: Check Next.js fullstack contract alignment and report mismatches
---

# Contract Validator

## Scope

- Zod schemas vs frontend types.
- Route handler request/response shape vs service DTOs.
- Prisma model shape vs exposed API contracts.
- API responses vs frontend expectations.

## Workflow

1. Identify the resource or feature scope.
2. Compare fields, nullability, enums, and defaults across layers.
3. Identify serialization/renaming differences (`snake_case` vs `camelCase`, hidden/internal fields).
4. Produce a mismatch report with fixes.

## Output

- Contract report with table: field, layer, expected vs actual.
- Recommended fixes and risk notes.

## Safety

- Never assume implicit defaults.
- Never relax validation without stating impact.
- Never change contracts without listing breaking changes.

## Definition of Done

- [ ] All fields compared across layers.
- [ ] Nullability mismatches listed.
- [ ] Enum/value mismatches listed.
- [ ] Hidden/internal fields leakage checked.
- [ ] Fix plan included.

## References

See `references/contract-report-template.md`.
