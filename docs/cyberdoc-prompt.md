# CyberDoc — AI / Developer Implementation Prompt

> Version: 2025-11-03 (current working spec in repo)

## Table of Contents

- [CyberDoc — AI / Developer Implementation Prompt](#cyberdoc--ai--developer-implementation-prompt)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Key Features (MVP)](#key-features-mvp)
  - [User Roles \& Auth](#user-roles--auth)
  - [Client \& Document Flows](#client--document-flows)
  - [API Endpoints (spec)](#api-endpoints-spec)
  - [Data Model Summary](#data-model-summary)
  - [I18n, RTL \& Localization Rules](#i18n-rtl--localization-rules)
  - [Template Processing \& Document Generation](#template-processing--document-generation)
  - [UI Components \& Flows](#ui-components--flows)
  - [Security \& Compliance](#security--compliance)
  - [Non-functional Requirements \& Tests](#non-functional-requirements--tests)
  - [Deliverables, Milestones \& Acceptance Criteria](#deliverables-milestones--acceptance-criteria)
  - [References \& Source Files](#references--source-files)
  - [Onboarding / Implementation Notes](#onboarding--implementation-notes)

---

## Overview

Build CyberDoc — a bilingual (Arabic / French) document generation and management app for a Moroccan cybercafé. The system centralizes client data and legal/administrative document templates (DOCX), enables employees to generate print-ready documents (PDF), and provides an Admin back-office for template & employee management, reporting, and auditing.

Primary goals:

- Employee-facing UI in Arabic `ar-MA` (RTL) with Tajawal font.
- Admin-facing UI in French `fr`.
- Reliable DOCX → PDF generation preserving Arabic layout and placeholders.
- Full audit trail and print history; basic cash/statistics tracking.

## Key Features (MVP)

- Authentication & roles (Admin / Employee).
- Employee login by `nickname` + password (created by Admin); direct redirect to employee home.
- Admin login by `email` + password.
- Client CRUD, search by name / CIN / phone, client detail page.
- Template CRUD (DOCX asset), field mapping, bilingual labels (FR / AR), versioning.
- Document create/duplicate/edit → preview → generate PDF → print; store `PrintHistory` & `ActivityLog`.
- Filters: category, date range, title, created-by, client.
- Daily stats (DailyStats), editable price per template, record payments for reporting.
- I18n files (`locales/ar.json`, `locales/fr.json`), RTL layout support.

## User Roles & Auth

- Admin: email + password. Capabilities: templates CRUD, employees CRUD, dashboard, reports.
- Employee: nickname + password (Admin-created). Capabilities: search clients, create/generate documents, print, record payments.

Security:

- Password hashing (Scrypt / BetterAuth suggested), role-based middleware for admin endpoints, HTTP-only cookies for sessions, optional 2FA.

## Client & Document Flows

Employee flow:

1. Login (nickname) → Employee home (Arabic).
2. Search client by name/CIN/phone; select client.
3. View client's documents (filter by category/title/date). Duplicate/create new.
4. Fill dynamic form (fields from `TemplateField`), preview, generate PDF, print.

Admin flow:

1. Login (email) → Admin dashboard (French).
2. Manage templates (upload DOCX → parse fields → translate/confirm → publish) and employees.
3. View today's documents, per-employee activity, run reports.

## API Endpoints (spec)

Auth

- POST /api/auth/login { identifier, password, type }
- POST /api/auth/logout
- GET /api/auth/me

Clients

- GET /api/clients?search=&page=&perPage=
- GET /api/clients/:id
- POST /api/clients
- PUT /api/clients/:id

Documents

- GET /api/documents?clientId=&category=&from=&to=&search=
- GET /api/clients/:clientId/documents
- POST /api/documents (create)
- POST /api/documents/:id/duplicate
- POST /api/documents/:id/generate -> { status, url }
- POST /api/documents/:id/print -> record `PrintHistory`

Templates (Admin)

- GET /api/admin/templates
- POST /api/admin/templates (upload docx)
- POST /api/admin/templates/:id/parse
- PUT /api/admin/templates/:id
- DELETE /api/admin/templates/:id

Admin (Employees)

- GET/POST/PUT/DELETE /api/admin/employees

Reporting

- GET /api/admin/daily-stats?date=
- GET /api/admin/activity-logs?filters=

> All admin endpoints must enforce server-side role checks.

## Data Model Summary

Important models (see `prisma/schema.prisma` and `docs/analysis/data-model` for complete schema):

- User (id, name, email, passwordHash, nickname, cin, phone)
- Role / UserRole (ADMIN, EMPLOYEE)
- Client / Persona (cin, nameAr/nameFr, phone, address)
- DocumentTemplate / TemplateAsset (DOCX file, locale, titleAr/titleFr, version)
- TemplateField / TemplateFieldGroup (labels + labelAr, fieldType, validation)
- Document / DocumentFieldValue / DocumentClient / DocumentStatus
- PrintHistory, DailyStats, ActivityLog

Notes:

- Ensure `nickname` is unique.
- Templates and fields should include Arabic labels/placeholders (`fieldLabelAr`, `placeholderAr`).

## I18n, RTL & Localization Rules

- Default employee locale: `ar-MA` (RTL). Admin default: `fr`.
- Provide `locales/ar.json` and `locales/fr.json` for all UI strings and error messages.
- Use `next-intl` or `i18next` with proper server-side locale detection.
- All date, number and currency formatting should use `Intl` with the active locale.
- Ensure CSS/Components support RTL switching (Tailwind `dir=rtl`, logical properties).
- Fonts: Tajawal for Arabic; Public Sans / system for French.

## Template Processing & Document Generation

Ingesting templates:

- Upload `.docx` files → create `TemplateAsset` → `POST /parse` to extract placeholders → create `TemplateField` entries.

Template placeholder types supported: TEXT, NUMBER, AMOUNT (numbers in words), DATE, SELECT, SIGNATURE.

Generation approach (recommended):

- Fill placeholders in DOCX via `docx-templater` or similar → convert rendered HTML → use Playwright or Puppeteer to render HTML and print to PDF (keeps Arabic RTL layout intact).
- Alternative: fill DOCX and convert to PDF with LibreOffice.
- Store generated PDF in object storage and the path on the Document record; record `PrintHistory` on print.

Validation:

- Use Zod for client & server schema validation of form input.

## UI Components & Flows

Core components:

- `Login` (switch logic for nickname/email)
- `EmployeeHome` (search clients, filters)
- `ClientDetail` (client info + documents list)
- `DocumentWizard` (choose template → fill → preview → generate)
- `TemplateEditor` (parse & edit fields, translations)
- `AdminDashboard` (today's docs, activity feed, stats)
- `PrintView` (print-ready PDF viewer)

Design notes:

- Employee UI must be RTL and Arabic-first; Admin UI French-first.
- Provide search bar with fuzzy search (name/CIN/phone) and paginated results.

## Security & Compliance

- Passwords hashed with Scrypt (BetterAuth guidance). Migrate Bcrypt if present.
- Encrypt sensitive files at rest; use secure signed URLs for downloads.
- Detailed `ActivityLog` for auditability (create/generate/print/delete actions).
- Backups daily, retention policy and secure credentials management.

## Non-functional Requirements & Tests

- Document generation time ≤ 10s.
- Form load ≤ 3s on typical ADSL workstation.
- E2E tests (Playwright) for critical flows: login, create document, preview/generate/print, admin templates & employee CRUD.
- Unit tests for services (template parsing, generation, validation).
- CI: GitHub Actions for lint/test/build; PR checks.

## Deliverables, Milestones & Acceptance Criteria

Deliverables:

- Next.js (App Router) + TypeScript app with described features.
- Prisma schema + migrations + seed (admin user & sample templates).
- Template parser & document generator pipeline (DOCX → PDF).
- Admin dashboard & employees CRUD.
- `locales/ar.json` and `locales/fr.json` base files.

Milestones (suggested):

1. DB + Auth + basic employee/admin flows
2. Template upload + field parsing + dynamic form
3. Generation & Print (PDF) + store
4. Admin dashboard, stats & tests

Acceptance examples:

- Employee can login with `nickname`, search client, create & generate document in Arabic.
- Admin can upload DOCX, parse fields and publish template.
- Generated PDF preserves Arabic layout and placeholders.
- Activity logs show who generated/printed a document along with timestamps.

## References & Source Files

- Primary spec: `docs/Cahier-des-Charges-CyberDoc-*.md`
- Prototypes: `docs/prototype/stitch_login_screen/*` (RTL login & wizard screens)
- Templates: `templates_docs/*.docx` (Arabic templates to map)
- Data model docs: `docs/analysis/data-model/*`
- Existing services: `services/documentGenerationService.ts`

## Onboarding / Implementation Notes

- Add `nickname` to `User` model and make it unique.
- Add `titleAr`, `fieldLabelAr`, and `placeholderAr` where appropriate to templates/fields.
- Seed a default Admin account and a couple of Employee accounts for testing.
- Provide a simple Playwright e2e test that signs in as employee (nickname), searches a client and generates a sample document.

---

*Generated with analysis of repo files under `docs/` and `templates_docs/` on 2026-01-29.*
