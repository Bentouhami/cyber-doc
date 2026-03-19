# RC Smoke Report

Date: 2026-03-19  
Branch: `release/rc-checklist`  
Scope: Release candidate baseline checks

## 1) Automated Quality Gates

- `npm run lint`: PASS
- `npm run type-check`: PASS
- `npm run build`: PASS

Notes:
- Build completed with all routes generated.
- Non-blocking warning observed:
  - `baseline-browser-mapping` data is older than two months.

## 2) Database and Prisma Checks

- `npx prisma migrate status`: PASS (schema up to date)
- `npx prisma generate`: PASS
- `npx prisma db seed`: PASS (after adding `migrations.seed` to `prisma.config.ts`)

Seed summary:
- Roles: 2
- Activity types: 11
- Document statuses: 4
- File formats: 3
- Field types: 8
- Templates: 3
- Template fields: 61
- Participant roles: 6
- Printers: 1
- App settings: 3

## 3) Manual Functional Smoke (To Execute)

### Auth & Session
- [ ] Login as admin
- [ ] Login as employee
- [ ] Logout flow

### Admin
- [ ] `/admin/templates` list renders
- [ ] template detail page renders
- [ ] create template works
- [ ] import template works
- [ ] edit/update template works
- [ ] delete template works
- [ ] `/admin/employees` CRUD works

### Employee Documents
- [ ] `/documents` list renders
- [ ] `/documents/create` generation flow works
- [ ] update existing document works
- [ ] duplicate document works
- [ ] preview works
- [ ] download works
- [ ] print flow logs history
- [ ] payment patch works and computes status correctly

## 4) RC Summary

Current state: automated gates are green and DB baseline is healthy.  
Pending before release decision: complete manual functional smoke list and record any defects.

