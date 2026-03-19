# CyberDoc Project Master Plan

Date: 2026-03-19  
Branch context: `release/rc-checklist`  
Purpose: single execution checklist from project stabilization to production release.

## Usage

- `Status`: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`
- `Owner`: assign one person per task.
- `Due`: set target date.
- Keep this file updated in every PR that changes plan progress.

## Phase 0 - Scope Lock

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P0-1 | Confirm MVP boundary and freeze out-of-scope items | TBD | TODO | TBD | Must be approved before new feature intake |
| P0-2 | Create/align issue board with priorities (Blocker/Major/Minor) | TBD | TODO | TBD | Source from RC issues and backlog |
| P0-3 | Publish final MVP acceptance criteria | TBD | TODO | TBD | Link to go/no-go doc |

## Phase 1 - Stability Baseline

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P1-1 | Keep `npm run lint` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-2 | Keep `npm run type-check` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-3 | Keep `npm run build` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-4 | Enforce PR-only merge policy to `dev`/`main` | TBD | TODO | TBD | Team process item |

## Phase 2 - Core Functional Completion

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P2-1 | Validate auth flow (admin login/logout/redirects) | TBD | TODO | TBD | Manual smoke |
| P2-2 | Validate auth flow (employee login/logout/redirects) | TBD | TODO | TBD | Manual smoke |
| P2-3 | Validate admin templates (list/detail/create/import/edit/delete) | TBD | TODO | TBD | Manual smoke |
| P2-4 | Validate employee CRUD in admin area | TBD | TODO | TBD | Manual smoke |
| P2-5 | Validate documents flow (create/update/duplicate/preview/download/print/payment) | TBD | TODO | TBD | Manual smoke |
| P2-6 | Fix all runtime defects found in smoke | TBD | TODO | TBD | Open issues tracker |

## Phase 3 - Data and Contract Hardening

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P3-1 | Verify Prisma migration status on target DB | TBD | DONE | 2026-03-19 | `migrate status` up to date |
| P3-2 | Verify Prisma client generation in CI/local | TBD | DONE | 2026-03-19 | `prisma generate` pass |
| P3-3 | Verify seed reproducibility on clean state | TBD | DONE | 2026-03-19 | `prisma db seed` pass |
| P3-4 | Contract audit: API payloads vs schema/types | TBD | TODO | TBD | Ensure no drift |

## Phase 4 - QA and Regression Coverage

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P4-1 | Add/validate E2E smoke for critical routes | TBD | TODO | TBD | Playwright recommended |
| P4-2 | Add API integration tests for templates/documents/payments | TBD | TODO | TBD | Focus on mutation endpoints |
| P4-3 | Add permission boundary tests (admin/employee/unauthorized) | TBD | TODO | TBD | Security baseline |

## Phase 5 - Frontend UX and Accessibility Final Pass

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P5-1 | Mobile + desktop responsive review (critical pages) | TBD | TODO | TBD | `/`, `/documents`, `/admin/*` |
| P5-2 | Loading/empty/error states review | TBD | TODO | TBD | User-facing reliability |
| P5-3 | i18n RTL/LTR consistency review | TBD | TODO | TBD | Arabic/French |
| P5-4 | Keyboard navigation and focus accessibility review | TBD | TODO | TBD | shadcn/radix flows |

## Phase 6 - Ops and Release Readiness

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P6-1 | Finalize setup/deploy/rollback runbook | TBD | TODO | TBD | Add exact commands |
| P6-2 | Finalize environment variable reference | TBD | TODO | TBD | `.env` contract |
| P6-3 | Finalize backup and restore checklist | TBD | TODO | TBD | DB + generated files |
| P6-4 | Prepare release notes and known limitations | TBD | TODO | TBD | v1 release note |

## Phase 7 - RC Execution and Decision

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P7-1 | Complete `rc-smoke-report.md` manual section | TBD | TODO | TBD | In progress |
| P7-2 | Update `rc-open-issues.md` with real defects | TBD | TODO | TBD | Severity-based |
| P7-3 | Complete `rc-go-no-go.md` decision and sign-off | TBD | TODO | TBD | Product + Eng + QA |
| P7-4 | Close all blocker issues before GO | TBD | TODO | TBD | Mandatory |

## Phase 8 - Production Release

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P8-1 | Merge release branch to `dev` and `main` with tag | TBD | TODO | TBD | Tag format: `v1.0.0` |
| P8-2 | Run production migration and post-deploy smoke | TBD | TODO | TBD | Must be scripted |
| P8-3 | Monitor logs/errors for 24-48h | TBD | TODO | TBD | Hotfix window |

## Phase 9 - Post-Release Closure

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P9-1 | Close release checklist and archive evidence | TBD | TODO | TBD | Link PRs and reports |
| P9-2 | Plan v1.1 enhancement backlog | TBD | TODO | TBD | Non-MVP items only |

## Current Snapshot

- Automated gates: green (`lint`, `type-check`, `build`)
- Prisma baseline: healthy (`migrate status`, `generate`, `seed`)
- Remaining to ship: complete manual smoke + go/no-go signoff + deploy runbook closure

