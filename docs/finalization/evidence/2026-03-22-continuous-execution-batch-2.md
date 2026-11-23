# Evidence - Continuous Execution Batch (2026-03-22, late)

## Scope completed in this batch

1. UX/accessibility baseline improvement on form fields
2. CI wiring for critical regression runner
3. Baseline validation rerun

## Code changes

- `components/ui/input.tsx`
  - Added `aria-label` fallback from placeholder when explicit `aria-label` is absent.
- `components/ui/textarea.tsx`
  - Added `aria-label` fallback from placeholder when explicit `aria-label` is absent.
- `components/admin/templates/template-create-form.tsx`
  - Added explicit `aria-label` on key `SelectTrigger` controls.
  - Added explicit `aria-label` to generated HTML read-only preview textarea.
- `.github/workflows/frontend.yml`
  - Migrated CI from obsolete `frontend/` layout to root project layout.
  - Added root-path PR triggers.
  - Added quality gates (`lint`, `type-check`, `i18n:audit`, `build`, `prisma generate`).
  - Added `critical-smoke` job with Playwright Chromium install and `npm run test:e2e:critical`.

## Validation commands run

- `npm run lint` -> PASS
- `npm run type-check` -> PASS
- `npm run build` -> PASS
- UX smoke wrapper (`scripts/ux-route-check-runner.mjs`) -> PASS (28/28)

## UX quality metric update

From `tmp/ux-check/results.json` after this batch:
- `/admin/templates/new`: lacking reduced from previous high value to `10` (still open for targeted cleanup)
- `/admin/employees`: lacking now `1`
- `/documents/create?entryMode=new`: lacking now `1`

Interpretation:
- Route-level failures are zero.
- Remaining work is form-field polish, not runtime/blocker defects.

## Docs synced

- `docs/finalization/mvp-execution-todo.md`
  - Marked “Wire runner into CI” as DONE under 4.4.
- `docs/finalization/remaining-tasks-execution-list.md`
  - Updated critical suite status to “CI wired, env hardening pending”.
- `docs/finalization/rc-open-issues.md`
  - Updated RC-006 wording to reflect CI wiring completion.
