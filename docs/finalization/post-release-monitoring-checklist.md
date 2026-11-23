# Post-Release Monitoring Checklist

Date: 2026-11-23
Observation window: deployment through 48 hours after full internal rollout

## Monitoring contract before deployment

- [ ] Name the release owner and the operator watching the first hour.
- [ ] Save the dashboard or log queries used for HTTP status, route latency,
  container restarts, PostgreSQL connections and disk/volume usage.
- [ ] Measure the same immutable images on staging and record the baseline error
  rate and p95 latency for the previous stable release or pre-release soak.
- [ ] Probe `/api/health` at least once per minute from outside the application
  container; alert after three consecutive failures.
- [ ] Route JSON events where `event="api_error"` by `route`, `operation` and
  `errorType`. CyberDoc intentionally omits messages, payloads, credentials and
  customer identifiers from these events.
- [ ] Confirm the platform HTTP logs contain timestamp, method, normalized route,
  status and duration. Do not retain query strings, request bodies, cookies or
  document contents.
- [ ] Test delivery of one synthetic alert to the named operator before release.

The monitoring provider is a deployment choice. Production approval requires the
capabilities above, not a particular vendor.

## Staged rollout

1. Deploy to staging and run the complete critical smoke.
2. Deploy the immutable production images with access limited to the release team.
3. Verify readiness, logs and one dedicated non-customer test document.
4. Observe for one business hour, then open access to all employees only if every
   advance threshold below is green.
5. Continue active monitoring for 48 hours and record every hold or rollback
   decision in the release evidence.

## Decision thresholds

| Signal | Advance | Hold and investigate | Roll back |
| --- | --- | --- | --- |
| `/api/health` | No failed probes | 1–2 consecutive failures | 3 consecutive failures or any confirmed DB/storage outage |
| HTTP 5xx rate | Within 10% of staging/previous baseline | 10–100% above baseline | More than 2× baseline or a repeated critical-flow 5xx |
| Route p95 | Within 20% of baseline | 20–50% slower | More than 50% slower on a critical route |
| `api_error` events | No new recurring signature | New isolated signature | Repeated database/filesystem/storage-policy signature affecting users |
| Data integrity | All invariants green | Unexplained count drift | Orphan, missing version/file, wrong price or unauthorized mutation |

For very low traffic, one repeated failure in login, generation, payment, download
or print is enough to hold; do not hide it behind a percentage with a small sample.
Rollback immediately for suspected data corruption, authorization bypass, secret
exposure or loss of document storage.

## Technical monitoring

- [ ] Record `/api/health` availability and every restart.
- [ ] Track 4xx and 5xx separately for `/api/auth/*`, `/api/documents/*`,
  `/api/templates/*`, `/api/users/*` and `/api/shortcuts/*`.
- [ ] Track p50/p95 request duration for login, document generation, preview,
  download, print and payment.
- [ ] Check CPU, memory, PostgreSQL connection usage and database disk growth.
- [ ] Check `documents_data` free space/growth and filesystem write failures.
- [ ] Confirm structured `api_error` events are readable and contain no PII.

## Functional monitoring

Use a dedicated test account/persona and remove or archive only according to the
approved retention policy.

- [ ] Owner and Responsible can authenticate; Employee permissions remain limited.
- [ ] Admin can create or import a draft template without activating unpriced content.
- [ ] Employee can create a document for an existing client and a new client.
- [ ] Version/copy, preview, download and print remain operational.
- [ ] Payment total and returned amount match the server-derived price and copy count.
- [ ] `LOGIN`, creation, update and print activity appear with the correct actor/date.

## Data integrity monitoring

- [ ] Run `pnpm run check:data` against a read-authorized operational connection at
  the agreed cadence and after every migration; preserve its JSON evidence.
- [ ] Confirm new documents have participants and a valid template/version chain.
- [ ] Reconcile generated-file metadata with files present in `documents_data`.
- [ ] Investigate abnormal duplicate-persona, print-count or payment-volume changes.
- [ ] Confirm exactly one active Owner remains.

## First-hour and 48-hour evidence

- [ ] At 15, 30 and 60 minutes, record readiness, error rate, p95, restarts and the
  outcome of the critical user flow.
- [ ] At 24 and 48 hours, record the same signals plus storage/database growth.
- [ ] Record incident IDs, decisions, operator and timestamps; never copy secrets or
  customer data into the evidence file.
- [ ] If rollback occurs, attach the recovery point, previous image digests and
  post-rollback smoke result.

## Closure criteria

- [ ] No blocker incident for 48 hours.
- [ ] No threshold remains in hold or rollback state.
- [ ] Alerts, logs and dashboards are owned for ongoing operations.
- [ ] Open issues are re-triaged as hotfix or backlog.
- [ ] `release-closure-note-template.md` is completed and linked from evidence.
