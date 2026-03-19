# Current State Audit (2026-03-19)

## Executive Summary

CyberDoc now has most functional building blocks implemented in code (auth, admin, templates, documents, payments, i18n), but `dev` is not release-ready yet.
The blocker is not missing product scope. The blocker is integration stability after branch consolidation.

## Reality Check: Did We Lose Data/Files?

Short answer: mostly no, but we had integration misses.

- Confirmed: files existed in backup branch and are now being re-aligned.
- Example of integration miss observed: `components/providers/user-profile-provider.tsx` was referenced by multiple pages/components but absent after merge.
- Result: runtime compile errors despite branch merges being complete.

Conclusion: this is integration drift, not a full loss of repository content.

## Branch Health Snapshot

- Base branch: `dev`
- Current working tree contains local fixes pending commit:
  - `components/auth/login.tsx`
  - `components/language-switcher.tsx`
  - `lib/auth-client.ts`
  - `components/providers/user-profile-provider.tsx` (new)

## Quality Gates (Measured)

### Lint (`npm run lint`)

- Status: failing.
- Current blocking errors: 2
- Files:
  - `components/auth/login.tsx`
  - `components/language-switcher.tsx`
- Cause:
  - `react-hooks/set-state-in-effect` rule violations in mount gating pattern.

### Type Check (`npm run type-check`)

- Status: failing.
- Error families observed:
  1. `Buffer` incompatible with `BodyInit` in file response routes.
  2. Prisma JSON typing mismatch (`JsonValue` vs `InputJsonValue` + `null` handling).
  3. Decimal/number arithmetic mismatch in payment and amount computations.
  4. ActivityLog relation payload mismatch (`activityType` connect typing).
  5. Template field include/type mismatches (`fieldType`, `groupField` property assumptions).
  6. Comparison logic issue in `components/templates/template-workbench.tsx`.

### Build (`npm run build`)

- Code reached compile stage, then failed in this environment due to Google Fonts fetch restrictions.
- This is environment/network related and separate from the TypeScript correctness issues above.

## Runtime Stability Findings

1. Missing module and missing export issues were reproduced (`user-profile-provider`, `signOut`).
2. Hydration mismatch warnings occurred on:
   - `LanguageSwitcher` (Radix dropdown IDs)
   - Login form field IDs/labels
3. Local mitigations were added but still need lint-compliant refinement.

## Documentation Health

- `docs/` contains rich material (analysis, finalization, data model).
- Root `README.md` is significantly outdated (old stack/version and old architecture assumptions).
- Some analysis docs include duplicated/merged text sections and need cleanup normalization.

## Risk Register (Current)

1. High: compile instability (`type-check` red).
2. High: runtime hydration regressions around auth/login shell.
3. Medium: docs drift causing planning confusion.
4. Medium: API contract drift around template/document/payment paths.

## Bottom Line

The project has the right feature breadth to finish quickly, but must pass a stabilization phase before new feature work.
The fastest path to completion is:

1. stabilize auth/i18n hydration and lint,
2. fix all TypeScript contract errors by domain,
3. run critical path QA,
4. freeze and ship MVP.

