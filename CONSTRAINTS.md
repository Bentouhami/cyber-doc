# CyberDoc Quality Constraints

Last reviewed: 2026-10-24

This file is the project's shipping contract. Fix the implementation when a gate
fails. Do not weaken a rule, skip a suite, or lower a threshold merely to obtain a
green result.

## Floor

- No new `@ts-ignore`, `@ts-nocheck`, `eslint-disable`, ignored security finding, or coverage suppression.
- No unfinished implementation stubs, empty error handlers, or skipped tests.
- No deleted tests or removed assertions without an explicit, reviewed reason.
- No secrets or real credentials in source, fixtures, logs, Git history, or CI configuration.
- No schema change without a forward migration and a tested compatibility path.
- No dependency or lockfile change without a clean dependency audit and full build.
- No protected API route without authentication, authorization, and boundary validation.
- No product behavior change without updating its canonical file in `docs/features/`.
- This quality contract cannot be weakened in the same change that needs the weaker rule.

## Enforced gates

| Dimension             | Blocking rule                            | Why                                                                   | Checked by                     | Runs at            |
| --------------------- | ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------ | ------------------ |
| Quality floor         | 0 violations                             | Prevents checks being silenced to make a change pass                  | `pnpm run quality:floor`       | local push, CI     |
| Secrets               | 0 findings                               | A committed secret must be treated as compromised                     | internal scan + Gitleaks       | local push, CI     |
| Types                 | 0 TypeScript errors                      | Type drift previously appeared during dependency upgrades             | `pnpm run type-check`          | local push, CI     |
| Lint                  | 0 ESLint errors                          | React/Next upgrade regressions must be corrected, not suppressed      | `pnpm run lint`                | local push, CI     |
| Unit logic            | 0 failing focused unit tests             | Pure boundary and access-policy regressions should fail quickly       | `pnpm run test:unit`           | local push, CI     |
| Dependencies          | 0 high or critical known vulnerabilities | High-impact supply-chain risk blocks delivery                         | `pnpm run quality:dependencies` | local push, CI    |
| Contracts             | 0 contract violations                    | API and schema consumers must stay aligned                            | `pnpm run check:contracts`     | local push, CI     |
| Feature documentation | all feature files valid                  | Documentation is part of the deliverable and prevents drift           | `pnpm run check:feature-docs`  | local push, CI     |
| Internationalization  | 0 missing French or Arabic keys          | Both supported languages are release requirements                     | `pnpm run i18n:audit`          | local push, CI     |
| Production build      | successful build                         | Compilation alone does not prove Next.js can package the app          | `pnpm run build`               | local push, CI     |
| Performance budget    | 7 critical routes within versioned JS/CSS gzip ceilings | Prevents meaningful client-transfer regressions without a network benchmark | `pnpm run performance:budgets` | local push, CI |
| Database              | all migrations applied                   | Runtime and schema must be compatible before delivery                 | `pnpm exec prisma migrate status` | local push, CI E2E |
| Critical behavior     | 4/4 suites, 0 skipped                    | Auth, permissions, admin CRUD, documents, mobile and RTL are critical | `pnpm run test:e2e:critical`   | local push, CI     |

## Measured, not yet enforced

| Metric                   | Current state                                 | Direction                                                                  |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------- |
| Unit-test coverage       | Focused runner covers query parsing and user access policy; coverage is not measured | Add coverage instrumentation and establish an evidence-based threshold |
| Accessibility automation | UX smoke checks layout and keyboard flow only | Add axe against a stable preview, then require 0 critical/serious findings |

## Exceptions

No active exceptions. Every future exception must identify its owner, reason, and
expiry date of at most 90 days.
