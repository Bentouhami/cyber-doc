# 2026-10-30 — Independent Release Review

## Verdict

**NO-GO.** The full local gate was green, but an independent read-only review
identified high-severity adverse paths outside its coverage. This finding proves
why a passing automated baseline cannot replace a fresh-context release review.

## Release-blocking findings

1. Payment status, change, paid date and totals were caller-controlled; the audit
   write was not atomic with the financial mutation.
2. Employees could enumerate inactive templates and generation did not require an
   active template.
3. Generation did not enforce required/known participant roles or template
   cardinality.
4. Contentless/PDF failure paths could persist partial or misleading document
   state and leave database/filesystem inconsistency.
5. Employee DOCX imports and asset download used incompatible storage roots;
   upload buffering/content validation were insufficient.
6. Several sensitive read APIs authenticated a user without requiring an allowed
   employee/admin role.
7. The application CSP was overly permissive in production.
8. The adverse cases above were absent from the critical QA suite.

## Reproducibility and operations findings

- The tested working tree is not yet an immutable commit and PR #12 points to an
  older failing head. No commit or push was authorized or performed.
- `dev` and `main` require obsolete GitHub contexts. The new read-only
  `pnpm run release:github-protection` check reproduces 14 findings.
- Docker CI, backup/restore, previous-image rollback and post-deploy smoke remain
  unproven.
- Privacy/retention/export/deletion policy values and named approvals remain open.

## Verification performed by the reviewer

- ESLint: PASS.
- TypeScript without incremental output: PASS.
- Unit tests: 47/47 PASS.
- Repository files were not edited by the reviewer.

## Corrective action

The findings were reopened as `SEC-002`, `QA-002` and RC-014 through RC-016.
Separate owners are implementing payment integrity, generation invariants, and
asset/authorization/CSP hardening. Every fix requires adverse regression tests,
canonical feature documentation and a fresh complete pre-push run before another
independent review.
