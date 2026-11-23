# RC Open Issues

Date: 2026-10-31
Branch: `release/v1.0.0-candidate`

## Blocking Release Conditions

The automated baseline and independent code review are green. Production release
remains blocked by the following operational and governance conditions; there is
no unresolved critical/high code finding in the reviewed working tree.

### RC-008 — Restore and rollback exercise pending

- Severity: Blocker for release
- Area: operations and data safety
- Current state: the coordinated PostgreSQL + `documents_data` backup procedure,
  archive validation, disposable restore gate and rollback evidence contract are
  documented but have not been exercised against the target environment.
- Exit criterion: timestamped evidence of backup creation, restore validation,
  previous-image rollback and post-rollback smoke.
- Owner: operations / database owner

### RC-017 — Historical Vercel production is not the release candidate

- Severity: Blocker for deployment identification and file durability
- Area: hosting / storage / release traceability
- Current state: the latest linked Vercel production deployment is `Ready`, but
  its 2026-08-07 build used npm, Next.js 16.2.0 and Prisma 7.5.0. It predates the
  reviewed working tree and has no proven durable CyberDoc document volume.
- Exit criterion: deploy the immutable v1 container revision with persistent
  database/document storage, or implement and verify the separate serverless
  storage/runtime architecture required by ADR 0007.
- Owner: operations / architecture / release owner

Evidence: `evidence/2026-10-31-vercel-target-audit.md`.

### RC-018 — Production monitoring is not provisioned

- Severity: Blocker for release
- Area: observability and incident response
- Current state: the vendor-neutral monitoring contract, safe `api_error` event
  fields, staged rollout, relative 5xx/p95 thresholds and 48-hour evidence template
  are documented. No target dashboard, external readiness probe or tested alert
  delivery is available from this workspace.
- Exit criterion: named operator, staging baseline, saved dashboard/log queries,
  one-minute external health probe and a successfully delivered synthetic alert.
- Owner: operations / release owner

### RC-019 — Login throttling and trusted proxy are not approved

- Severity: Blocker for release
- Area: authentication / deployment network
- Current state: Better Auth's production default limits sign-in to 3 attempts per
  10 seconds, but counters are process-local and client identity depends on
  `x-forwarded-for` or a shared fallback bucket. The existing PostgreSQL
  `rate_limits` model supports a shared counter without another service.
- Exit criterion: approve the employee lockout tradeoff and exact proxy CIDRs;
  configure database-backed sign-in limiting, prevent direct origin/header spoofing,
  and prove allowed attempts plus `429` behavior in the critical smoke.
- Owner: security / operations / Cyber Owner

### RC-009 — Privacy and retention policy pending

- Severity: Blocker for release approval
- Area: PII and audit data governance
- Current state: implementation minimizes activity-log responses, but retention
  periods, subject-request export/deletion behavior and policy owners require
  product/legal approval. The engineering inventory, decision worksheet and safe
  operations contract are ready in `docs/engineering/PRIVACY_OPERATIONS.md`.
- Exit criterion: approved policy plus tested operational procedure.
- Owner: product/legal with engineering

### RC-010 — Activity-log governance incomplete

- Severity: Major
- Area: administration and auditability
- Current state: the admin-only API and responsive FR/AR administration UI now
  pass permission, pagination, filtering, empty-state, mobile and accessibility
  checks. Retention, purge, monitoring and export policy remain undecided.
- Exit criterion: approved governance policy plus tested operations procedure.
- Owner: engineering / QA

## Non-Blocking Open Items

### RC-011 — Prisma PostgreSQL adapter warning

- Severity: Minor
- Area: dependencies
- Current state: an upstream `pg` deprecation warning can appear through the
  Prisma adapter. No local suppression is applied because that would hide an
  upstream compatibility signal.
- Action: track upstream Prisma resolution and retest on upgrade.

## Domain Risks Requiring Operator Validation

1. Payment arithmetic for edge multi-copy scenarios.
2. Import behavior for complex `.docx` documents.
3. Persona identity collision where CIN is absent and names are similar.
4. Target environment has at least one active printer when printing is enabled.

## Resolved Historical Items

- RC-007 container CI: PR #13 builds both production targets and passes all five
  required checks on the release revision.
- auth/session lifecycle and inactive-user revocation;
- protected UI/API role boundaries;
- security headers, strict preview isolation and template sanitization;
- file realpath containment, ownership enforcement and symlink rejection;
- PDF network/JavaScript isolation and bounded rendering;
- FR/AR route checks, accessible form names and responsive overflow checks;
- pnpm-only frozen dependency workflow and dual secret scanning.
- QA-002 contract and error-path inventory, including 17/17 request handlers and
  the critical permission, pagination, missing-resource and conflict scenarios.
- RC-014 financial integrity: server-derived totals/status/change, row-level
  serialization, atomic audit and contradictory/negative-input tests.
- RC-015 generation integrity: active-template and participant invariants,
  mixed stored/inline duplicate detection, atomic file publication and cleanup.
- RC-016 storage/authorization/CSP: bounded streamed uploads, one asset contract,
  sensitive-route role guards and per-request production CSP nonces.
- RC-013 GitHub governance: `dev` and `main` now require the five current checks;
  obsolete frontend/backend contexts were removed and read-back verification
  passes.
- RC-018 CI secrets: new CI-only random values were provisioned through standard
  input; the name-only audit passes and no value was logged or read back.

