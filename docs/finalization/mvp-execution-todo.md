# CyberDoc - MVP Execution TODO (Updated)

Date: 2026-03-22  
Source: `cahier-des-charges-v1.md`  
Rule: Finish one main feature block before moving to the next.
Mandatory gate: Run `pre-feature-discovery-checklist.md` before starting any feature.

Status legend:
- `[ ]` TODO
- `[-]` IN PROGRESS
- `[x]` DONE
- `[!]` BLOCKED

---

## Pre-Feature Gate (mandatory before every feature)

- [x] Run checklist: `docs/finalization/pre-feature-discovery-checklist.md`
- [x] Publish a short preflight note:
  - current state (already implemented / partial / not started),
  - reuse plan (DRY),
  - minimal change plan (KISS),
  - impacted files.
- [x] Only then move the target item to `[-] IN PROGRESS`.

Done criteria:
- No feature starts without discovery + reuse decision.

---

## Block 0 - Baseline Guard (always first)

- [x] `npm run lint`
- [x] `npm run type-check`
- [x] `npm run build`
- [x] `npm run i18n:audit`
- [x] `npx prisma migrate status`

Done criteria:
- All commands pass on current branch.

---

## Block 1 - Admin Core (must be fully stable)

### 1.1 Employee management (CRUD) [x] DONE
- [x] List employees works
- [x] Create employee works
- [x] Edit employee works
- [x] Deactivate/reactivate employee works
- [x] Delete employee works (with guardrails)
- [x] Validation errors are clear (FR/AR)

Done criteria:
- Full CRUD validated manually and no runtime error.

### 1.2 Templates management (CRUD + import) [x] DONE
- [x] Template list filters/sort/search are usable
- [x] Create template in guided mode works
- [x] Create template in developer mode works
- [x] Edit template works
- [x] Duplicate template works
- [x] Archive template works
- [x] Import template route works end-to-end

Done criteria:
- Admin can create/update/publish templates without technical help.

### 1.3 Duplicate guard and admin override
- [x] Duplicate detection warns clearly (title/slug/type/category)
- [x] Admin can override intentionally
- [x] Override is traceable in logs/metadata

Done criteria:
- No silent duplicates; intentional duplicates remain possible.

### 1.4 Admin i18n cleanup
- [x] No raw i18n keys in `/admin/*`
- [x] FR/AR labels are business-friendly
- [x] RTL layout verified in Arabic

Done criteria:
- Admin UI is clean in both languages.

---

## Block 2 - Employee Core (document production flow)

### 2.1 Entry flow: existing vs new client
- [x] `/documents` clearly shows both paths
- [x] `/documents/create?entryMode=new` is guided and simple
- [x] Existing client path prefills available data

Done criteria:
- Employee can always choose the right start path in one click.

### 2.2 Participant detection and selection
- [x] Participant cards are clear (primary/secondary)
- [x] Employee can choose one/many/none clients to persist
- [x] Confirmation modal is understandable in FR/AR

Done criteria:
- Selection behavior matches user intent every time.

### 2.3 Persona persistence and enrichment
- [x] Selected participants are persisted to personas
- [x] Document participant links are persisted
- [x] Existing persona gets enriched (missing fields updated)
- [x] Search and reuse from next document is verified

Done criteria:
- Returning client workflow saves time and reduces retyping.

### 2.4 Generation, print, download reliability
- [x] Generate document works consistently
- [x] Print view excludes app chrome/header/sidebar
- [x] Download endpoint returns file (no “File not found” regressions)

Done criteria:
- Employee can deliver a document without technical workaround.

### 2.5 Language consistency workflow
- [x] Arabic/French content checks warn (not block blindly)
- [x] Override option exists when legal names/addresses must stay original
- [x] Error messages explain what to do next

Done criteria:
- Language guard helps quality without blocking legal reality.

---

## Block 3 - UX Simplification Pass (Easy & Clean)

- [x] Every important input has label + gray placeholder
- [x] Forms avoid technical wording
- [x] Error states are short and actionable
- [x] Empty/loading states are clear
- [x] Mobile layout verified on key routes

Key routes:
- [x] `/admin/employees`
- [x] `/admin/templates`
- [x] `/admin/templates/new`
- [x] `/documents`
- [x] `/documents/create`
- [x] `/documents/[documentId]`

Done criteria:
- Non-technical employee can complete main flow with minimal guidance.

---

## Block 4 - QA and Safety Nets

### 4.1 Admin smoke runner
- [x] Add/update lightweight admin smoke script/checklist
- [x] Cover employee CRUD + template create/import/duplicate guard

### 4.2 Documents smoke runner
- [x] Cover new client path
- [x] Cover existing client path
- [x] Cover persistence checks
- [x] Cover generate/print/download

### 4.3 Data checks
- [x] Verify personas contain expected fields
- [x] Verify document_participants links are correct
- [x] Verify no obvious duplicates for same client identity

### 4.4 Critical E2E runner
- [x] Add unified critical runner (`admin + documents + ux`)
- [x] Make runner fully stable in restricted/sandboxed environments
- [x] Wire runner into CI

### 4.5 Permission boundary smoke
- [x] Add guest/employee/admin permission smoke runner
- [x] Validate denied admin endpoints for employee
- [x] Validate denied protected endpoints for guest

Done criteria:
- Repeatable smoke checks can be run before each merge.

---

## Block 5 - Release Candidate (RC)

- [x] Re-run full baseline guard
- [x] Re-run admin + documents smoke
- [x] Update `rc-smoke-report.md`
- [x] Update `rc-open-issues.md`
- [x] Finalize `rc-go-no-go.md`

Done criteria:
- GO decision supported by evidence, not assumptions.

---

## Execution mode (how we work day-to-day)

- Work in small PRs, one sub-feature at a time.
- Never start next block before current block is stable.
- After each merged PR, re-run:
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`

---

## Next immediate task (recommended)

`Phase 8 - Production Release Execution`

Reason:
- MVP technical gates are green.
- RC technical decision is documented as GO-CANDIDATE.
- Remaining work is operational: merge/tag/deploy/monitor and closure.
