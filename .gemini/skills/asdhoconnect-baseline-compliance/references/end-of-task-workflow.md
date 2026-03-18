# End-of-task workflow

## 1) Plan

- Define scope, files, and risks
- Use: asdhoconnect-architecture-guardian
- Pitfall: skipping scope clarity

## 2) Implement

- Apply minimal, scoped changes
- Use: asdhoconnect-nextjs-feature-scaffold, asdhoconnect-api-platform-resource-builder
- Pitfall: introducing one-off patterns

## 3) Validate

- Verify functional correctness and contracts
- Use: asdhoconnect-contract-validator
- Pitfall: ignoring type/nullability drift

## 4) Secure

- Review auth, exposure, permissions
- Use: asdhoconnect-security-review
- Pitfall: missing per-operation security rules

## 5) Document

- Update /Documentation and diagrams
- Use: asdhoconnect-docs-diagrams
- Pitfall: writing docs outside /Documentation

## 6) CI

- Run relevant checks and record status
- Use: asdhoconnect-task-scripter
- Pitfall: skipping checks or not noting failures

## 7) Compliance

- Final baseline gate
- Use: asdhoconnect-baseline-compliance
- Pitfall: marking compliant without closing gaps
