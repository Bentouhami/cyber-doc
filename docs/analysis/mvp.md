# MVP Scope (CyberDoc)

## Core Purpose
Digitalize document creation in a Moroccan cybercafe: fast form entry, preview, PDF generation, printing, and basic cash tracking.

## Roles
- **Admin (Gérant)**: manages templates + users, sees reports.
- **Employee (Agent/Editor)**: generates documents, records payment data, prints.

## Core Features
1. **Authentication + Roles**
   - Login, session, admin vs employee access.
2. **Template Management (Admin)**
   - Create/edit templates (HTML + CSS).
   - Validate placeholders vs required fields.
   - Publish/unpublish (employees see only published templates).
3. **Document Generation (Employee)**
   - Select template, fill dynamic fields, generate PDF.
   - Preview before download/print.
4. **Document History**
   - List, view, search/filter.
   - Duplicate/edit existing documents.
5. **Payments (Stats only)**
   - Base price per template.
   - Employee records copies + amount paid.
   - Store totals for admin reporting.
6. **Admin Reports**
   - Totals by employee and template (documents, charged, paid).

## Out of MVP
- Docx import automation, legal validation workflows, external notifications, client portal, advanced audit, multi-organization.

## MVP Workflow
1. Admin creates template → validates → publishes.
2. Employee selects template → fills form → preview → generate PDF → print/download.
3. Employee records payment for stats.
4. Admin reviews reports.
