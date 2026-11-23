# CyberDoc - Remaining Tasks Execution List

Date: 2026-03-22  
Mode: Continuous execution (one task end-to-end, then next)

## Goal

Finalize CyberDoc for non-technical employee productivity with Next.js 16 best practices, security hardening, and regression safety.

## Execution Order

1. UX Simplification Completion (Block 3)
2. Security Hardening Headers
3. Critical E2E Regression Suite
4. RC Refresh and Go/No-Go update

---

## 1) UX Simplification Completion (Block 3)

Status: `[x] DONE`

Scope:
- `/documents/create` wording cleanup and actionable errors
- Label + placeholder consistency on high-impact forms
- Keep FR/AR clarity and RTL behavior

Done when:
- No technical wording shown to employees/admins on primary forms
- Error messages explain what to fix next
- `check:ux` passes with no route failures

---

## 2) Security Hardening Headers

Status: `[x] DONE` (implemented in this execution cycle)

Scope:
- Add security headers in Next.js config:
  - `Content-Security-Policy`
  - `Strict-Transport-Security` (prod)
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`

Validation:
- `npm run build` passes
- No regression on `/documents` and `/admin` routes

---

## 3) Critical E2E Regression Suite

Status: `[x] DONE` (implemented, CI wired, restricted-env fallback added)

Scope:
- Add single-command critical E2E runner:
  - admin smoke
  - documents smoke
  - UX route checks
- Command: `npm run test:e2e:critical`

Artifacts:
- `scripts/e2e-critical-runner.mjs`
- report at `tmp/e2e-critical/results.json`

Remaining:
- Monitor fallback usage (`SMOKE_ALLOW_EPERM_SKIP=1`) and keep CI as strict source of truth

---

## 4) RC Refresh and Go/No-Go update

Status: `[x] DONE` (technical evidence updated, operational sign-off pending)

Scope:
- Re-run full baseline and smoke suite
- Update:
  - `docs/finalization/rc-smoke-report.md`
  - `docs/finalization/rc-open-issues.md`
  - `docs/finalization/rc-go-no-go.md`

Done when:
- Evidence-based GO/NO-GO decision is documented for current branch state.
