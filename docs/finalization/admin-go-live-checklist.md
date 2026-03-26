# Admin Go-Live Checklist

Date: 2026-03-20
Scope: CyberDoc `/admin`

## 1. Templates Operations
- [x] Admin can list templates with filters (status/locale/type/category/search)
- [x] Admin can create template in guided mode
- [x] Admin can create template in developer mode
- [x] Admin can import template from JSON
- [x] Admin can import template from Word
- [x] Admin can review pending requests (approve/reject)
- [x] Admin can duplicate template
- [x] Admin can archive/unarchive template
- [x] Admin can publish/unpublish template
- [x] Admin can open template asset download

## 2. Template Governance
- [x] Pre-publish checklist is visible
- [x] Publish is blocked when checklist is incomplete
- [x] Render validation endpoint works
- [x] Moderation timeline is visible with actor/time
- [x] Request metadata (requested by/at) is visible in detail

## 3. Employees & Users
- [x] Admin can list employees
- [x] Admin can filter employees by status and search by name/email
- [x] Admin can create employee
- [x] Admin can edit employee
- [x] Admin can activate/deactivate employee
- [x] Admin can soft-delete employee
- [ ] Self-protection rules block dangerous self-actions:
  - [x] self-delete blocked
  - [x] self-deactivate blocked
  - [x] self-admin-role-removal blocked
- [x] Friendly UI message shown for self-blocked actions
- [x] Admin accounts inventory + risk flag visible

## 4. i18n & UX
- [x] Admin pages are readable in FR
- [x] Admin pages are readable in AR
- [ ] No raw i18n keys visible in UI

## 5. Technical Gate
- [x] `npm run lint`
- [x] `npm run type-check`
- [ ] `npm run build` (known blocker currently: `spawn EPERM` in local environment)

## Evidence
- Templates list and moderation workflow: `app/admin/templates/page.tsx`, `components/admin/templates/template-list.tsx`
- Requests queue page: `app/admin/templates/requests/page.tsx`
- Template detail governance and timeline: `app/admin/templates/[slug]/page.tsx`, `components/admin/templates/template-detail.tsx`
- Duplicate API and moderation attribution: `app/api/templates/[slug]/duplicate/route.ts`, `app/api/templates/[slug]/route.ts`
- Employees operations and safeguards: `app/admin/employees/page.tsx`, `components/admin/employee-form.tsx`, `app/api/users/[userId]/route.ts`
- Last verification run:
  - `npm run lint` (pass)
  - `npm run type-check` (pass)
  - `npm run build` (blocked by `spawn EPERM`, known environment issue)

## Sign-Off Matrix
| Area | Owner | Status | Evidence |
|---|---|---|---|
| Templates CRUD | You + Codex | In Progress | `/admin/templates` |
| Requests Workflow | You + Codex | In Progress | `/admin/templates/requests` |
| Employees/User Admin | You + Codex | In Progress | `/admin/employees` |
| i18n FR/AR | You + Codex | In Progress | UI review |
| Final Gate | You + Codex | Blocked (build env) | CLI outputs |

## Release Decision
- Go: only when all mandatory checkboxes above are complete.
- No-Go: if any of sections 1, 2, or 3 has blocking failures.
