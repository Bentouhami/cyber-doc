# Recovery Plan to Release

## Goal

Finish CyberDoc MVP quickly with controlled risk and clear ownership.

## Delivery Strategy

Use a stabilization-first sequence, then feature hardening, then release prep.

## Phase 1: Stability Baseline (Priority P0)

Objective: make `dev` green again (`lint`, `type-check`, `dev` critical pages).

### Tasks

1. Finalize auth/profile provider integration.
2. Replace hydration workaround patterns that violate lint rules.
3. Fix all TS issues in document/template/payment routes:
   - Decimal normalization helpers,
   - JSON null-safe conversion helpers,
   - ActivityLog creation typing alignment,
   - Buffer response typing for Next response bodies.
4. Re-run:
   - `npm run lint`
   - `npm run type-check`
   - `npm run build` (with reachable fonts or local font fallback).

### Exit Criteria

- 0 ESLint errors.
- 0 TypeScript errors.
- No runtime crash on:
  - `/`
  - `/documents`
  - `/admin/templates`
  - `/admin/employees`

## Phase 2: Critical Workflow Hardening (Priority P1)

Objective: secure end-to-end business flows.

### Tasks

1. Test and fix template flows:
   - list, detail, create, import, validate, render-test.
2. Test and fix document flows:
   - generate, update, preview, download, print, duplicate.
3. Test and fix payment flow:
   - copies, unit price, discount/surcharge, paid amount, change, status transitions.
4. Verify role-based restrictions on all admin APIs and pages.

### Exit Criteria

- Full admin flow works with admin account.
- Full employee flow works with employee account.
- Payment records persist correctly and are visible in detail views.

## Phase 3: Documentation and Ops Readiness (Priority P1)

Objective: make project maintainable and handoff-ready.

### Tasks

1. Update root `README.md` to match real stack and architecture.
2. Publish endpoint catalog from implemented routes.
3. Add `.env` reference and runbook:
   - local setup,
   - seed/reset,
   - backup and rollback,
   - release checklist.
4. Keep `docs/project-state/*` as the live steering docs.

### Exit Criteria

- New team member can run and validate core flows in under 30 minutes using docs only.

## Phase 4: Release Candidate (Priority P2)

Objective: lock MVP and deploy safely.

### Tasks

1. Smoke E2E on critical paths.
2. Seed verification on clean DB.
3. Tag release branch/candidate.
4. Monitor first production usage and collect issue log.

### Exit Criteria

- RC accepted by product owner after smoke tests and doc sign-off.

## Suggested Work Breakdown by Branch

1. `fix/stability-auth-i18n`
2. `fix/ts-api-documents-payments`
3. `fix/ts-api-templates-import`
4. `docs/project-state-and-runbook`
5. `release/rc-v1`

## What To Do Next (Immediate)

1. Commit current auth/i18n integration fixes (or refine to lint-safe approach first).
2. Open one focused PR for TS fixes in document/payment routes.
3. Open second focused PR for template/import typing fixes.
4. Keep docs updated in parallel with each merged PR.

