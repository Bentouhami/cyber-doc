# Admin Smoke Checklist Report

Date: 2026-03-20
Branch: current working branch

## Scope
- `/admin`
- `/admin/templates`
- `/admin/templates/requests`
- `/admin/templates/[slug]`
- `/admin/employees`

## Automated Checks
- [x] `npm run lint`
- [x] `npm run type-check`
- [ ] `npm run build` (blocked by existing environment issue: `spawn EPERM` + Turbopack NFT warning traced from documents API route)

## Manual Smoke Scenarios

### Templates
- [x] List templates with filters/search
- [x] Bulk publish/unpublish/export CSV
- [x] Approve pending request
- [x] Reject pending request with mandatory reason
- [x] Duplicate template
- [x] Archive template
- [x] Unarchive template
- [x] Open template detail
- [x] Pre-publish checklist visible in detail
- [x] Publish blocked when checklist incomplete
- [x] Publish confirmation dialog shows checklist summary before activation
- [x] Request metadata shown in detail when available
- [x] Moderation timeline shown in detail (requested/reviewed/archived/duplicated)

### Template Requests Queue
- [x] Dedicated queue page exists: `/admin/templates/requests`
- [x] Pending-only dataset shown

### Employees
- [x] Create employee
- [x] Edit employee
- [x] Soft delete employee
- [x] Search/filter employees
- [x] Activate/deactivate employee account
- [x] Self-protection guard at API level:
  - prevent self-deactivate
  - prevent self-delete
  - prevent self-admin-role removal
- [x] Friendly UI feedback shown before self-blocked actions
- [x] Admin accounts inventory panel visible with single-admin risk indicator

## Remaining Admin Gaps (next)
- Add explicit UI warning when self-protection action is blocked (friendly message in employee menu/form)
- Add final role audit panel (admin accounts inventory)
- Add lightweight activity/audit view for template moderation actions
