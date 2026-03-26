# RC Smoke Report

Date: 2026-03-22  
Branch: `release/rc-checklist`  
Scope: Release candidate baseline + critical smoke checks

## 1) Automated Quality Gates

- `npm run lint`: PASS
- `npm run type-check`: PASS
- `npm run i18n:audit`: PASS
- `npm run build`: PASS

Notes:
- Next.js build is green with current route set.
- Security headers are configured in `next.config.ts`.

## 2) Database and Prisma Checks

- `npx prisma migrate status`: PASS (schema up to date)
- `npx prisma generate`: PASS

## 3) Critical Smoke Evidence (latest)

Evidence files:
- `tmp/admin-smoke/results.json`
- `tmp/documents-smoke/results.json`
- `tmp/ux-check/results.json`

Summary:
- Admin smoke: PASS (`passCount: 26`, `failCount: 0`)
- Documents smoke: PASS (`passCount: 13`, `failCount: 0`)
- UX route checks: PASS (`passCount: 28`, `failCount: 0`)

## 4) UX Simplification Validation

- Raw i18n key leakage: none on critical routes.
- Field quality warnings: cleared on critical routes (`fieldWarning=false` in latest UX report).
- FR/AR + RTL/LTR checks: passing on desktop and mobile profiles.

## 5) Remaining Non-Blocking Risks

- RC-006: unified critical runner in restricted local Windows sandbox may still fail with Playwright `spawn EPERM`; CI is now wired for Linux Playwright profile.
- Domain-specific quality items to monitor during real operator usage:
  - payment arithmetic in edge multi-copy scenarios,
  - complex `.docx` import edge cases,
  - persona identity collision when CIN is absent.

## 6) RC Summary

Current state: baseline + critical smoke are green for MVP core routes and flows.  
Blocking defects from 2026-03-19 are resolved in current branch state.
