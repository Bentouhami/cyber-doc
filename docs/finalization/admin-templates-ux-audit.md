# Admin UX Audit - Templates Workflow

Date: 2026-03-20
Scope: /admin routes with focus on template operations (create, import JSON, import Word, review/update)

## Current Admin Surface
- `/admin`
- `/admin/templates`
- `/admin/templates/new`
- `/admin/templates/import`
- `/admin/templates/[slug]`
- `/admin/employees`

## Main Friction Points Found
1. Too many clicks between template tasks
- Admins needed to navigate list -> create/import repeatedly.

2. Import workflow split mentally
- JSON import existed, Word import existed on a separate endpoint path.
- No single import page to handle both formats.

3. Technical-first language in places
- Several labels and hints were oriented to technical users, not operations staff.

4. Low confidence before save
- Create flow had raw HTML visibility, but not enough visual confidence for non-technical admins unless they understood code.

## Implemented Quick Wins
1. Faster entry points from template list
- Added direct action: Import Word from `/admin/templates` header actions.

2. Unified import page with 2 modes
- `/admin/templates/import` now supports:
  - JSON import mode
  - Word (.docx) import mode with metadata form + file picker
- Word mode posts to `/api/templates/requests/import` and redirects to created template detail.

3. Better import ergonomics
- Added JSON format action and clearer import validation/error feedback.

4. i18n expansion (FR/AR)
- Added new translation keys for import modes, messages, and hints.

## Remaining High-Value Improvements (Next)
1. Template list productivity
- Add search + filters (status, locale, review status) + quick publish/unpublish badges.

2. Detail page simplification
- Add "Admin action rail": Validate, Preview, Publish, Duplicate in a single top section.

3. Role-aware defaults
- In create flow, allow selecting a preset profile (e.g., Attestation, Contract, Procuration) that prebuilds fields.

4. Stronger success states
- After create/import, show CTA panel with:
  - Open detail
  - Test render
  - Publish

## Recommended Delivery Order
1. List filters + saved query params
2. Detail page action rail
3. Preset starter templates in create flow
4. QA pass with real admin scenarios (5-10 scripted flows)
