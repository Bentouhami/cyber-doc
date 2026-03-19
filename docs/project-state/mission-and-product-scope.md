# CyberDoc Mission and Product Scope

## Mission

CyberDoc is an internal fullstack platform for Moroccan cybercafes to:

- generate legal/administrative documents quickly,
- manage reusable templates safely,
- track printing and cash payment operations,
- provide traceability for admin oversight.

## Core Problem We Are Solving

The business currently needs fast document production at the counter with low friction and low error rate.
The system must let employees create/reprint/reuse documents in minutes while keeping reliable records for the manager.

## Target Users

- Admin (manager): controls templates, employees, and global visibility.
- Employee (operator): creates documents, prints, and records payment.

## MVP Outcome (What “Done” Means)

CyberDoc MVP is complete when the following outcomes are stable in production:

1. Secure login/session and role-based access.
2. Admin can manage templates and employee accounts.
3. Employee can generate documents from dynamic templates.
4. Employee can preview, print, duplicate, and download documents.
5. Payment data (copies, totals, paid amount, change) is recorded correctly.
6. Document history and participant/persona data are searchable and reusable.
7. System passes quality gates (lint, type-check, build) and has a release runbook.

## Explicitly Out of Current MVP

- external customer portal,
- advanced legal workflow automation,
- card/online payments,
- multi-tenant organizations.

## Success Metrics (Practical)

- Time to generate a standard document: under 3 minutes end-to-end in UI flow.
- Time to duplicate and regenerate an existing document: under 1 minute.
- 0 blocking runtime errors on critical paths (`/`, `/documents`, `/admin/templates`, `/admin/employees`).
- 0 TypeScript compile errors and 0 ESLint errors on `dev`.

