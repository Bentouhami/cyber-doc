# CyberDoc Feature Service Matrix

Date: 2026-03-22
Last updated by: Codex
Purpose: Living functional inventory of services exposed by the system.

## Maintenance Rules

- Update this file in every PR that changes a functional feature.
- Keep routes exact and current.
- Use maturity values: `DONE (MVP)`, `PARTIAL`, `PLANNED`, `OUT OF MVP`.
- If a feature regresses, set maturity to `PARTIAL` and add next action.

## Functional Services Matrix

| Service | Target User | Main Routes | Maturity | Owner | Next Action |
|---|---|---|---|---|---|
| Authentication & role access | Admin, Employee | `/`, `/api/auth/[...all]`, protected `/admin/*`, `/documents*` | DONE (MVP) | Bentouhami/Codex | Monitor in RC smoke |
| Employee management (CRUD) | Admin | `/admin/employees`, `/api/users`, `/api/users/[userId]`, `/api/users/me` | DONE (MVP) | Bentouhami/Codex | Keep role/self-protection checks |
| Template catalog management | Admin | `/admin/templates`, `/admin/templates/[slug]`, `/api/templates`, `/api/templates/[slug]` | DONE (MVP) | Bentouhami/Codex | Monitor moderation/review UX |
| Template creation (guided + advanced) | Admin | `/admin/templates/new`, `/api/templates`, `/api/template-taxonomy`, `/api/template-assets` | DONE (MVP) | Bentouhami/Codex | Keep guided mode as default |
| Template import (Word + draft flow) | Admin | `/admin/templates/import`, `/admin/templates/import?mode=word`, `/api/templates/import`, `/api/templates/requests/import` | DONE (MVP) | Bentouhami/Codex | Improve complex DOCX edge handling |
| Template governance (duplicate/review/archive) | Admin | `/api/templates/[slug]/duplicate`, `/admin/templates/requests`, `/api/templates/requests` | DONE (MVP) | Bentouhami/Codex | Keep duplicate guard quality |
| Documents dashboard & intake choice | Employee | `/documents` | DONE (MVP) | Bentouhami/Codex | Keep clarity of entry modes |
| Existing client flow | Employee | `/documents/create?personaId=<id>&entryMode=existing`, `/api/personas`, `/api/personas/[personaId]/documents` | DONE (MVP) | Bentouhami/Codex | Expand search precision if needed |
| New client flow | Employee | `/documents/create?entryMode=new`, `POST /api/documents/generate` | DONE (MVP) | Bentouhami/Codex | Keep form speed + validation clarity |
| Participant detection & selective persistence | Employee | UI in `/documents/create`, backend in `/api/documents/generate` | DONE (MVP) | Bentouhami/Codex | Watch multi-participant edge cases |
| Persona enrichment/reuse | Employee | `/api/personas`, `/api/documents/generate`, `document_participants` linkage | DONE (MVP) | Bentouhami/Codex | Add merge strategy in v1.1 |
| Document lifecycle (view/update/duplicate/payment) | Employee | `/documents/[documentId]`, `/api/documents/[documentId]`, `/api/documents/[documentId]/duplicate`, `/api/documents/[documentId]/payment` | DONE (MVP) | Bentouhami/Codex | Monitor payment/status edge cases |
| Preview/print/download delivery | Employee | `/api/documents/[documentId]/preview`, `/documents/[documentId]/print`, `/api/documents/[documentId]/download` | DONE (MVP) | Bentouhami/Codex | Keep file-storage checks in smoke |
| Language quality guard (FR/AR legal context) | Employee | checks inside `/documents/create` submit flow | DONE (MVP) | Bentouhami/Codex | Tune warning precision (v1.1) |
| i18n FR/AR + RTL/LTR UX | Admin, Employee | across `/admin/*`, `/documents*` | DONE (MVP) | Bentouhami/Codex | Continue i18n audit in CI |
| QA regression services | Internal | `scripts/permissions-smoke-runner.mjs`, `scripts/admin-smoke-runner.mjs`, `scripts/documents-smoke-runner.mjs`, `scripts/ux-route-check-runner.mjs`, `scripts/contract-audit.mjs`, `scripts/e2e-critical-runner.mjs` | DONE (MVP) | Bentouhami/Codex | Keep CI strict, local fallback only |

## Out of MVP (Tracked for v1.1+)

- Certified legal translation automation.
- Persona merge/dedup wizard with operator approval.
- Advanced OCR pipeline for scanned templates.
- Extended accounting/invoicing workflows.

## Related Docs

- `docs/finalization/cahier-des-charges-v1.md`
- `docs/finalization/mvp-execution-todo.md`
- `docs/finalization/project-master-plan.md`
- `docs/finalization/rc-smoke-report.md`
