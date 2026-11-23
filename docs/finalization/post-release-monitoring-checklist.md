# Post-Release Monitoring Checklist (24-48h)

Date: 2026-03-22

## Technical monitoring

- [ ] Verify server uptime and restart events.
- [ ] Track 4xx/5xx trends on `/api/documents/*`, `/api/templates/*`, `/api/users/*`.
- [ ] Check document generation latency trend.
- [ ] Check file storage growth and write failures.

## Functional monitoring

- [ ] Admin can still create/import template.
- [ ] Employee can create from existing client path.
- [ ] Employee can create from new client path.
- [ ] Download and print remain stable.

## Data integrity monitoring

- [ ] New personas persist expected fields.
- [ ] `document_participants` links are present for generated docs.
- [ ] No abnormal identity duplication spikes.

## Closure criteria

- [ ] No blocker incidents for 48h.
- [ ] Open issues re-triaged (hotfix vs backlog).
- [ ] Release closure note added in evidence.
