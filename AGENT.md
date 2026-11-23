# CyberDoc project memory

`AGENTS.md` is the vendor-neutral instruction contract for every assistant.
This file captures the current architecture. The enforceable quality bar lives in
`CONSTRAINTS.md`; the delivery loop and lessons learned live in
`docs/engineering/QUALITY_PROCESS.md`.

## Current stack

- Next.js 16 App Router, React 19, TypeScript and Tailwind CSS 4.
- PostgreSQL through Prisma and `@prisma/adapter-pg`.
- Better Auth with database sessions and credential accounts.
- Zod 4 validation at API boundaries.
- Playwright-based API and browser smoke suites.
- pnpm 12 and `pnpm-lock.yaml` are authoritative.

## Current product capabilities

- Credential authentication with `admin` and `employee` roles.
- Protected admin and document areas with API-level authorization.
- Employee CRUD, role assignment, activation and password changes.
- Template CRUD, import, duplication, validation and PDF render tests.
- Dynamic French/Arabic document forms, personas, PDF generation, downloads,
  printing and payment tracking.
- French/Arabic translations, RTL support, responsive layouts and keyboard-flow
  smoke checks.
- Activity logging and Prisma migrations for persisted data evolution.

## Non-negotiable implementation rules

- Protect resources at the API boundary; UI visibility is never authorization.
- Validate untrusted payloads with Zod before business logic.
- Credential `Account.accountId` equals its owning `User.id`; email changes must
  not alter that invariant.
- Every schema or stored-data semantic change needs a forward Prisma migration.
- Seed operations remain idempotent and use the same invariants as production.
- Resolve generated-file paths under an allowlisted storage root and prevent
  traversal.
- Never log passwords, hashes, session tokens, complete personal records, or
  secrets.
- Never commit a credential. Use environment-variable references and run both
  secret scanners; a Gitleaks finding is a rotation incident, not a lint warning.
- Preserve French, Arabic, RTL, mobile and document-delivery behavior whenever a
  shared component or API changes.

## Required verification

- Iteration: `pnpm run quality:fast` plus focused tests.
- Before push: `pnpm run quality:prepush`.
- Before merge: required GitHub checks must be green with no skipped critical
  suite.
- Every behavior change updates a canonical file under `docs/features/`; every new
  feature starts from `docs/features/_template.md` and is added to the index.
- Record expensive-to-reverse decisions as sequential ADRs under `docs/decisions/`.
