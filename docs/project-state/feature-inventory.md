# Feature Inventory (Code-Based)

Date: 2026-03-19  
Branch analyzed: `dev`  
Source basis: `app/**`, `app/api/**`, `components/**`, `services/**`, `prisma/**`

## Snapshot

- UI pages: 11 (`app/**/page.tsx`)
- API route handlers: 23 (`app/api/**/route.ts`)
- Components: 76
- Services: 4

## Feature Matrix

### 1) Authentication and Session

- UI entry: `/` (login page), `components/auth/login.tsx`
- API: `/api/auth/[...all]`
- Server auth core: `lib/auth.ts`, `lib/auth-client.ts`
- Status: Implemented, currently fragile due to recent merge drift.
- Notes:
  - Better Auth is wired.
  - Session checks are used in middleware-like proxy and API guards.
  - Recent hydration/auth-client mismatch was detected and patched locally.

### 2) Authorization (RBAC)

- Roles in schema: `Role`, `UserRole`
- Guards:
  - `proxy.ts` route protection for `/admin` and `/documents`
  - `lib/admin-auth.ts` for API-level authorization
  - `components/auth/route-guard.tsx` for client-side guard behavior
- Status: Implemented.
- Notes:
  - Admin-only paths are enforced.
  - Employee access to documents is enforced.

### 3) Internationalization (FR/AR)

- Locale resources: `locales/fr/common.json`, `locales/ar/common.json`
- Provider/hooks: `components/providers/i18n-provider.tsx`, `hooks/use-locale.ts`, `lib/i18n.ts`
- UI switcher: `components/language-switcher.tsx`
- Status: Implemented, with hydration-sensitivity in UI components.
- Notes:
  - SSR/client consistency must remain controlled for Radix-heavy components.

### 4) Admin Home and Admin Layout

- UI: `/admin`, `app/admin/layout.tsx`, `components/layout/admin-header.tsx`, `admin-footer.tsx`
- Status: Implemented.
- Notes:
  - Entry cards for templates and employees are present.
  - Layout is role-guarded.

### 5) Employee Management

- UI: `/admin/employees`
- API:
  - `GET /api/users`
  - `POST /api/users`
  - `GET|PATCH|DELETE /api/users/[userId]`
  - `POST /api/employees` re-exported from users route
- Status: Implemented.
- Notes:
  - CRUD paths exist.
  - Role badge rendering is now based on `EmployeeDTO.roles[]`.

### 6) Template Catalog and Detail

- UI:
  - `/admin/templates`
  - `/admin/templates/[slug]`
- API:
  - `GET|POST /api/templates`
  - `GET|PATCH|DELETE /api/templates/[slug]`
- Status: Implemented, type safety currently unstable in template routes.
- Notes:
  - Rich include graph exists (field types, groups, participant roles, assets).
  - Several type-check errors indicate drift with Prisma model typing.

### 7) Template Creation and Import

- UI:
  - `/admin/templates/new`
  - `/admin/templates/import`
- API:
  - `POST /api/templates/import`
  - `GET /api/template-assets`
  - `GET /api/templates/[slug]/validate`
  - `POST /api/templates/[slug]/render-test`
  - `GET /api/templates/[slug]/asset`
- Services:
  - `services/templateImportService.ts`
  - `services/documentGenerationService.ts`
- Status: Implemented, not release-stable.
- Notes:
  - Import flow is advanced and reusable.
  - JSON typing and route typing errors are currently blocking CI quality gates.

### 8) Documents Dashboard and History

- UI: `/documents` (`components/documents/documents-dashboard.tsx`)
- API: `GET /api/documents`
- Status: Implemented.
- Notes:
  - Filter/list behavior exists.
  - Requires regression test pass after type fixes.

### 9) Document Creation and Generation

- UI: `/documents/create`
- API:
  - `POST /api/documents/generate`
  - `PATCH /api/documents/[documentId]`
- Services: `documentGenerationService.ts`
- Status: Implemented, with typing debt.
- Notes:
  - Generation supports HTML/PDF and template payload rendering.
  - Decimal/JSON typing mismatches affect update/payment routes.

### 10) Document Detail, Preview, Download, Print, Duplicate

- UI:
  - `/documents/[documentId]`
  - `/documents/[documentId]/print`
- API:
  - `GET /api/documents/[documentId]/preview`
  - `GET /api/documents/[documentId]/download`
  - `POST /api/documents/[documentId]/print`
  - `POST /api/documents/[documentId]/duplicate`
- Status: Implemented, with type-level blockers.
- Notes:
  - Buffer response typing needs correction in download/render endpoints.

### 11) Payment and Cash Tracking

- API: `PATCH /api/documents/[documentId]/payment`
- Schema: `Document` monetary fields + cashier references
- Status: Implemented in design, unstable in compile state.
- Notes:
  - Decimal arithmetic currently mixes `Decimal` and `number`, causing TS failures.

### 12) Personas and Participants

- API: `GET|POST /api/personas`
- Schema: `Persona`, `DocumentParticipant`
- Status: Implemented.
- Notes:
  - Participant model is strong and supports multi-role participants per document.

### 13) Lookup Endpoints and Supporting Data

- API:
  - `GET /api/document-statuses`
  - `GET /api/document-creators`
  - `GET /api/users/me`
- Status: Implemented.
- Notes:
  - These endpoints support dashboard and form selectors.

### 14) Activity Logging and Stats Foundations

- Schema: `ActivityLog`, `ActivityType`, `DailyStats`, `PrintHistory`
- Services: `dailyStatsService.ts`
- Status: Partially implemented.
- Notes:
  - Data model exists and some write paths exist.
  - Type mismatches in activity log creation indicate relation usage drift.

### 15) Seeded Baseline Data

- Seed script: `prisma/seed.ts`
- Includes:
  - roles, admin user, auth seeds,
  - field types and grouped fields,
  - document templates and template assets,
  - participant roles, settings, printers.
- Status: Implemented and extensive.
- Notes:
  - Seed contains rich domain setup and should remain version-controlled carefully.

## Feature Coverage Gaps (Cross-Cutting)

1. Quality gates not passing (`lint`, `type-check`).
2. Hydration stability on some client components (Radix/form id generation context).
3. API contract consistency drift (Prisma JSON, Decimal arithmetic, relation connect payloads).
4. Documentation drift between old app description and current fullstack reality.

