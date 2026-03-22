# CyberDoc Project Master Plan

Date: 2026-03-22  
Branch context: `dev`  
Purpose: single execution checklist from project stabilization to production release.

## Focused Track Docs

- Employee flow simplification (intake to generation): `docs/finalization/employee-workflow-simplification-plan.md`

## Usage

- `Status`: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`
- `Owner`: assign one person per task.
- `Due`: set target date.
- Keep this file updated in every PR that changes plan progress.

## Phase 0 - Scope Lock

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P0-1 | Confirm MVP boundary and freeze out-of-scope items | Bentouhami/Codex | DONE | 2026-03-22 | `cahier-des-charges-v1.md` + MVP TODO aligned |
| P0-2 | Create/align issue board with priorities (Blocker/Major/Minor) | Bentouhami/Codex | DONE | 2026-03-23 | Added `issue-board-priority-map.md` with OPS-001..OPS-006 |
| P0-3 | Publish final MVP acceptance criteria | Bentouhami/Codex | DONE | 2026-03-22 | See `cahier-des-charges-v1.md` + `rc-go-no-go.md` |

## Phase 1 - Stability Baseline

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P1-1 | Keep `npm run lint` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-2 | Keep `npm run type-check` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-3 | Keep `npm run build` green on `dev` | TBD | DONE | 2026-03-19 | Verified |
| P1-4 | Enforce PR-only merge policy to `dev`/`main` | Bentouhami/Codex | DONE | 2026-03-23 | Enforced via GitHub API; evidence: `2026-03-23-branch-protection-enforced.md` |

## Phase 2 - Core Functional Completion

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P2-1 | Validate auth flow (admin login/logout/redirects) | Bentouhami/Codex | DONE | 2026-03-22 | Passing in smoke checks |
| P2-2 | Validate auth flow (employee login/logout/redirects) | Bentouhami/Codex | DONE | 2026-03-22 | Passing in smoke checks |
| P2-3 | Validate admin templates (list/detail/create/import/edit/delete) | Bentouhami/Codex | DONE | 2026-03-22 | Covered by admin smoke + manual checks |
| P2-4 | Validate employee CRUD in admin area | Bentouhami/Codex | DONE | 2026-03-22 | Covered by admin smoke |
| P2-5 | Validate documents flow (create/update/duplicate/preview/download/print/payment) | Bentouhami/Codex | DONE | 2026-03-22 | Covered by documents smoke |
| P2-6 | Fix all runtime defects found in smoke | Bentouhami/Codex | DONE | 2026-03-22 | Historical blockers resolved |

## Phase 3 - Data and Contract Hardening

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P3-1 | Verify Prisma migration status on target DB | TBD | DONE | 2026-03-19 | `migrate status` up to date |
| P3-2 | Verify Prisma client generation in CI/local | TBD | DONE | 2026-03-19 | `prisma generate` pass |
| P3-3 | Verify seed reproducibility on clean state | TBD | DONE | 2026-03-19 | `prisma db seed` pass |
| P3-4 | Contract audit: API payloads vs schema/types | Bentouhami/Codex | DONE | 2026-03-22 | Added `scripts/contract-audit.mjs` + `npm run check:contracts` (15/15 pass) |

## Phase 4 - QA and Regression Coverage

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P4-1 | Add/validate E2E smoke for critical routes | Bentouhami/Codex | DONE | 2026-03-22 | Admin/documents/ux runners + unified runner |
| P4-2 | Add API integration tests for templates/documents/payments | Bentouhami/Codex | DONE | 2026-03-22 | Added to smoke runners: template validate/render-test + document payment PATCH |
| P4-3 | Add permission boundary tests (admin/employee/unauthorized) | Bentouhami/Codex | DONE | 2026-03-22 | `scripts/permissions-smoke-runner.mjs` + `npm run smoke:permissions` |

## Phase 5 - Frontend UX and Accessibility Final Pass

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P5-1 | Mobile + desktop responsive review (critical pages) | Bentouhami/Codex | DONE | 2026-03-22 | UX route checks pass on desktop/mobile |
| P5-2 | Loading/empty/error states review | Bentouhami/Codex | DONE | 2026-03-22 | Primary flows reviewed and simplified |
| P5-3 | i18n RTL/LTR consistency review | Bentouhami/Codex | DONE | 2026-03-22 | FR/AR + dir checks passing |
| P5-4 | Keyboard navigation and focus accessibility review | Bentouhami/Codex | DONE | 2026-03-22 | Added keyboard/focus checks in `ux-route-check-runner.mjs` and validated on FR/AR desktop+mobile |

## Phase 6 - Ops and Release Readiness

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P6-1 | Finalize setup/deploy/rollback runbook | Bentouhami/Codex | DONE | 2026-03-22 | `deploy-runbook.md` |
| P6-2 | Finalize environment variable reference | Bentouhami/Codex | DONE | 2026-03-22 | `environment-reference.md` |
| P6-3 | Finalize backup and restore checklist | Bentouhami/Codex | DONE | 2026-03-22 | `backup-restore-checklist.md` |
| P6-4 | Prepare release notes and known limitations | Bentouhami/Codex | DONE | 2026-03-22 | `release-notes-v1.0.0-rc.md` |

## Phase 7 - RC Execution and Decision

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P7-1 | Complete `rc-smoke-report.md` manual section | Bentouhami/Codex | DONE | 2026-03-19 | Scripted smoke evidence captured |
| P7-2 | Update `rc-open-issues.md` with real defects | Bentouhami/Codex | DONE | 2026-03-19 | RC-001..RC-003 logged |
| P7-3 | Complete `rc-go-no-go.md` decision and sign-off | Bentouhami/Codex | DONE | 2026-03-22 | Status updated to GO-CANDIDATE |
| P7-4 | Close all blocker issues before GO | Bentouhami/Codex | DONE | 2026-03-22 | No open blocker in RC issues |

## Phase 8 - Production Release

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P8-1 | Merge release branch to `dev` and `main` with tag | Bentouhami | IN_PROGRESS | 2026-03-23 | Gate is `npm run release:freeze-audit` clean; see `release-commit-freeze-checklist.md` + `2026-03-23-release-freeze-audit.md` |
| P8-2 | Run production migration and post-deploy smoke | Bentouhami | TODO | TBD | Execute `deploy-runbook.md` after P8-1 |
| P8-3 | Monitor logs/errors for 24-48h | Bentouhami | TODO | TBD | Execute `post-release-monitoring-checklist.md` after deploy |

## Phase 9 - Post-Release Closure

| ID | Task | Owner | Status | Due | Notes |
|---|---|---|---|---|---|
| P9-1 | Close release checklist and archive evidence | Bentouhami/Codex | IN_PROGRESS | 2026-03-23 | Added closure template (`release-closure-note-template.md`); final fill after deploy+monitoring |
| P9-2 | Plan v1.1 enhancement backlog | Bentouhami/Codex | DONE | 2026-03-23 | Added prioritized backlog (`v1.1-backlog-prioritized.md`) |

## Current Snapshot

- Automated gates: green (`lint`, `type-check`, `build`, `i18n:audit`)
- Prisma baseline: healthy (`migrate status`, `generate`)
- RC technical decision: GO-CANDIDATE with non-blocking monitoring items only
- Remaining to ship: operational sign-off + production release execution (Phase 8/9)

