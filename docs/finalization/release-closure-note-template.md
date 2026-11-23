# Release Closure Note Template

Date: YYYY-MM-DD  
Release: `v1.0.0`  
Owner: ___

## 1) Release Summary

- Tag/commit:
- Deploy window:
- Environment:
- Scope delivered:

## 2) Gates and Evidence

- Preflight: pass/fail (link evidence)
- Critical smoke: pass/fail (link evidence)
- DB migrate status: pass/fail
- Post-deploy smoke: pass/fail

## 3) Monitoring (24-48h)

- Monitoring owner and dashboard/log-query links:
- Staging/previous-release baseline window:
- `/api/health` availability and restart count:
- HTTP 5xx rate and comparison with baseline:
- Critical-route p95 and comparison with baseline:
- New `api_error` signatures:
- PostgreSQL and `documents_data` growth/free space:
- Login/generation/payment/download/print health:
- 15/30/60-minute and 24/48-hour evidence links:
- Incidents opened:
- Hold/rollback decisions:

## 4) Open Issues After Release

- Blockers:
- Majors:
- Minors:

## 5) Decision

- Release closed: yes/no
- Hotfix needed: yes/no
- Follow-up backlog promoted: yes/no

## 6) Links

- `docs/finalization/production-release-checklist.md`
- `docs/finalization/post-release-monitoring-checklist.md`
- `docs/finalization/rc-go-no-go.md`
- `docs/finalization/issue-board-priority-map.md`
