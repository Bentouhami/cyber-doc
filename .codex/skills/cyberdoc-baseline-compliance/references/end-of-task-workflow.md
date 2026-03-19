# End-of-task workflow

## 1) Plan

- Define scope, files, and risks
- Use: cyberdoc-architecture-guardian
- Pitfall: skipping scope clarity

## 2) Implement

- Apply minimal, scoped changes
- Use: cyberdoc-nextjs-feature-scaffold
- Pitfall: introducing one-off patterns

## 3) Validate

- Verify functional correctness and contracts
- Use: cyberdoc-contract-validator
- Pitfall: ignoring type/nullability drift

## 4) Secure

- Review auth, exposure, permissions
- Use: cyberdoc-security-review
- Pitfall: missing per-route or per-method security rules

## 5) Document

- Update `/docs` and diagrams
- Use: cyberdoc-docs-diagrams
- Pitfall: writing docs outside `/docs`

## 6) CI

- Run relevant checks and record status
- Use: cyberdoc-task-scripter
- Pitfall: skipping checks or not noting failures

## 7) Compliance

- Final baseline gate
- Use: cyberdoc-baseline-compliance
- Pitfall: marking compliant without closing gaps
