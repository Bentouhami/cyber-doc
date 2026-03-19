# Task Delivery Checklist (CyberDoc)

Use this checklist at task start and before merge.

## 1) Qualification Gate
- [ ] Issue/task id exists and scope is clear.
- [ ] Parent/dependencies verified when applicable.
- [ ] Blockers resolved or explicitly escalated.
- [ ] Acceptance criteria are testable.

## 2) Scope and Architecture Gate
- [ ] In-scope / out-of-scope documented.
- [ ] Impacted files/layers identified.
- [ ] Risk points listed (auth, data, contracts, migration).
- [ ] Duplicate/overlap check completed (`dev`, open PRs, merged commits).

## 3) Git Gate
- [ ] Start from latest integration branch (`dev` unless project says otherwise).
- [ ] Branch name is scoped and consistent.
- [ ] Workspace hygiene checked (no unrelated files mixed).

## 4) Implementation Gate
- [ ] Minimal required behavior implemented.
- [ ] Hardening pass completed (validation, error handling, auth checks).

## 5) Test Gate
- [ ] Targeted tests added/updated.
- [ ] Regression coverage addressed.
- [ ] Targeted and broader checks executed.
- [ ] Manual UI/API scenarios reviewed.

## 6) Documentation Gate
- [ ] Behavior/contract updates documented under `/docs`.
- [ ] Diagram updates added when relevant.
- [ ] Traceability to issue/task id included.

## 7) Delivery Gate
- [ ] Clean staged scope.
- [ ] Clear commit message(s).
- [ ] PR package ready (title, summary, validation notes).
- [ ] Issue moved to done only after merge.

## 8) Post-Merge Gate
- [ ] Return to integration branch.
- [ ] Pull latest changes.
- [ ] Confirm clean local status.
- [ ] Share `Task Done Recap` in chat.
