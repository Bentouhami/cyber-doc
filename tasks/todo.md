# CyberDoc production-readiness checklist

## Phase 1 — Evidence and blocking risks

- [x] **PR-001 — Reconcile product capability evidence**

  - Acceptance: every entry in `docs/features/README.md` maps to UI/API/schema/test evidence.
  - Acceptance: discrepancies are recorded with severity and owner.
  - Verify: `pnpm run check:feature-docs`.
  - Dependencies: none.

- [x] **SEC-001 — Threat-model the current application**

  - Acceptance: trust boundaries, assets and STRIDE abuse cases are documented.
  - Acceptance: auth, templates, generated files, PII and admin actions are covered.
  - Verify: peer security review plus both secret scanners.
  - Dependencies: none.

- [x] **SEC-002 — Resolve blocking security findings**

  - Acceptance: no unresolved critical/high reachable finding.
  - Acceptance: every fix has an abuse-case regression test and feature-doc update.
  - Verify: focused test, `pnpm run quality:fast`, then critical E2E.
  - Dependencies: SEC-001.
  - Progress: account lifecycle/session revocation, template sanitization and
    preview isolation, PDF SSRF/DoS bounds, generic API errors, realpath
    containment and symlink rejection are implemented and regression-tested.
    The independent-review findings are now closed: payment state is derived
    and mutated atomically, generation enforces active templates and participant
    invariants, DB/file failure paths are consistent, imported assets share one
    bounded storage contract, sensitive routes enforce roles, and production CSP
    uses per-request nonces. Focused abuse tests and the full gate pass.

- [x] **PERF-001 — Establish repeatable performance baselines**

  - Acceptance: build/bundle, critical-route and representative API timings are recorded.
  - Acceptance: measurement conditions and variance are documented.
  - Verify: repeat the same measurement at least three times.
  - Dependencies: none.

- [x] **ARCH-001 — Rank architecture hotspots**
  - Acceptance: oversized/coupled files are ranked by risk and change frequency.
  - Acceptance: extraction candidates have behavior-preserving test seams.
  - Verify: five-axis review of proposed boundaries.
  - Dependencies: PR-001.

## Checkpoint A

- [x] No critical/high security blocker remains.
- [x] `pnpm run quality:fast` passes.
- [x] Audit and baseline evidence contain no secrets or personal data.

## Phase 2 — Test and feature completeness

- [x] **QA-001 — Add unit/integration test foundation**

  - Acceptance: a maintained runner covers selected high-risk pure logic/API boundaries.
  - Acceptance: CI executes the suite with no skip.
  - Verify: new test command plus `pnpm run quality:verify`.
  - Dependencies: PR-001, SEC-001.
  - Evidence: Node 22 + `tsx --test` covers integer query parsing and user
    access lifecycle policy; `test:unit` runs inside `quality:fast`. Coverage is
    not measured yet and no percentage is claimed.

- [ ] **AUD-001 — Complete the activity-audit capability**

  - Acceptance: authorized users can inspect useful audit events with bounded pagination.
  - Acceptance: sensitive values are never stored or returned.
  - Acceptance: UI/API permissions and error paths have tests and documentation.
  - Verify: focused tests and critical E2E.
  - Dependencies: SEC-002, QA-001.
  - Progress: admin-only paginated/filterable API, minimized response, FR/AR
    responsive UI and permission/error/UI smoke coverage are complete. Product
    and legal decisions on retention/purge, monitoring and export remain open,
    so the capability stays partial.

- [x] **A11Y-001 — Automate critical accessibility checks**

  - Acceptance: critical routes have automated WCAG-focused checks.
  - Acceptance: zero critical/serious violation under documented fixtures.
  - Verify: accessibility suite in CI.
  - Dependencies: QA-001.
  - Evidence: direct pinned `@axe-core/playwright` dependency runs in the stable
    critical browser fixture across FR/AR and desktop/mobile; 32/32 checks pass
    with zero critical/serious Axe violation.

- [x] **QA-002 — Close documented contract and error-path gaps**
  - Acceptance: each proven gap has a regression test and canonical doc update.
  - Verify: focused tests, contracts, i18n and E2E.
  - Dependencies: PR-001, QA-001.
  - Progress: the contract auditor passes 4/4 self-tests and inspects 17/17
    request handlers; invalid pagination returns structured `400` responses;
    the browser suites prove guest/employee/admin denials, lifecycle revocation,
    duplicate/language guards, preview/CSP, download, duplication, immutability,
    printing, payment, missing-resource and activity filter/empty/error paths.
    The formerly missing adverse cases now cover contradictory/negative payment
    input, inactive templates, participant cardinality and mixed stored/inline
    duplicate identities, generation failure consistency, imported DOCX
    retrieval, chunked upload bounds, concurrent printing and printer validity.

## Checkpoint B

- [ ] Every v1 catalogue capability is complete with automated evidence.
- [x] Build, schema status, contracts, i18n and critical E2E pass.
- [x] No behavior change lacks a `docs/features` update.

## Phase 3 — Measured performance and operations

- [x] **PERF-002 — Fix measured bottlenecks**

  - Acceptance: each kept change beats run-to-run variance with green tests.
  - Acceptance: neutral or worse experiments are reverted and logged.
  - Verify: same before/after benchmark and `pnpm run quality:verify`.
  - Dependencies: PERF-001, QA-001.
  - Evidence: PDF median improved from 705 ms to 216 ms; profile loading fell
    from five calls to one and is guarded against stale-session races; the
    template-list query is about 64% faster and returns about 82.6% less data.

- [x] **PERF-003 — Add stable regression budgets**

  - Acceptance: budgets cover the measured metrics users feel.
  - Acceptance: CI failure thresholds account for normal variance.
  - Verify: budget job passes repeatedly on the CI environment.
  - Dependencies: PERF-002.
  - Evidence: deterministic post-build gzip budgets cover seven critical routes,
    fail closed on missing assets/routes and pass identically across rebuilds.

- [ ] **OPS-001 — Prove deployment and rollback readiness**

  - Acceptance: frozen install, container build, migration, backup/restore and rollback are exercised.
  - Acceptance: post-deploy smoke evidence is current.
  - Verify: release checklist and CI/container evidence.
  - Dependencies: Checkpoint B.
  - Progress: container topology, immutable image contract and rollback runbook
    are implemented. Docker is unavailable locally; CI execution, CI-only secret
    provisioning, backup/restore proof and replacement of obsolete GitHub
    required-check contexts remain open. ADR 0007 identifies the persistent
    container topology as the supported v1 production target; the historical
    Vercel deployment is preview-only and is not release evidence.

- [ ] **PRIV-001 — Define PII retention and subject-request operations**
  - Acceptance: data classes, purposes, retention owners and deletion/export paths are documented.
  - Acceptance: approved policies have end-to-end verification.
  - Verify: privacy review and operational exercise.
  - Dependencies: product/legal decisions.
  - Progress: the data inventory, safeguards, decision table, subject-request
    runbook and automation safety contract are documented in
    `docs/engineering/PRIVACY_OPERATIONS.md`. Policy values, approved export/purge
    behavior and operational proof remain pending.

## Final checkpoint

- [x] `pnpm install --frozen-lockfile --ignore-scripts` succeeds under the documented policy.
- [x] `pnpm run quality:prepush` passes without skipped suites.
- [x] Independent correctness, architecture, security and performance code review is approved.
- [x] Release evidence, known limitations and rollback instructions are current.
