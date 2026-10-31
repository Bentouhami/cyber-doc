# Admin Scope Delivery Plan

## Goal
Finish all `/admin` features end-to-end (Templates + Employees/Users) before starting `/documents` scope.

## Phase A: Templates Admin (current)

### A1. Request Intake and Review
- [x] Employee can create request when template is missing (`/api/templates/requests`).
- [x] Employee can import Word request (`/api/templates/requests/import`).
- [x] Dedicated admin navigation entry for pending requests (`/admin/templates/requests` -> draft filter).
- [x] Add explicit approve/reject actions from admin UI (status update in metadata).
- [ ] Add requested-by / requested-at display in template cards/details.

### A2. Template CRUD Hardening
- [x] Create template (simple + developer modes).
- [x] Import JSON / Word from admin page.
- [x] Edit template details.
- [x] Publish/unpublish and bulk actions.
- [x] Filter/search + CSV export.
- [x] Add duplicate-template action in admin UI.
- [x] Add soft-delete/archive flow (confirm + recover strategy).

### A3. Template Quality Gates
- [x] Validate placeholders endpoint exists.
- [x] Add “pre-publish checklist” panel in UI:
  - required placeholders present
  - base price set
  - PDF options valid
  - participant roles coherent
- [ ] Add one-click render preview before activation.

## Phase B: Employees / Users Admin

### B1. CRUD Completion
- [x] List employees.
- [x] Create employee.
- [x] Edit employee.
- [x] Delete employee.
- [ ] Add search + role/status filters in employee list.
- [ ] Add activation/deactivation toggle (instead of destructive delete only).

### B2. Role and Access Admin
- [ ] Add role assignment audit view (who has admin role).
- [ ] Protect critical actions with stronger confirmation (delete, role escalation).
- [ ] Add self-protection rule (cannot remove own last admin role).

### B3. User Operations
- [ ] Add reset-password/admin password set flow.
- [ ] Add last login/session visibility (if available from auth provider).
- [ ] Add activity log basics for account changes.

## Definition of Done for `/admin`
- All template + employee/user flows are executable from UI without manual DB edits.
- i18n complete for FR/AR on all admin pages.
- `npm run lint`, `npm run type-check`, `npm run build` pass in stable local environment.
- Smoke test scenarios documented with pass results.

## Execution Order (strict)
1. A1 approve/reject workflow UI.
2. A2 duplicate/archive actions.
3. A3 pre-publish checklist + preview.
4. B1 employee list filters + activation toggle.
5. B2/B3 security and operations polish.
