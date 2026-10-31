# 2026-03-23 - Branch Protection Enforced (`dev`/`main`)

## Scope

Execute `P1-4` by enforcing PR-only merge policy directly on GitHub.

## Repository

- `Bentouhami/cyber-doc`

## Applied via GitHub API

Rules applied on both `dev` and `main`:

- Require pull request reviews:
  - minimum approving reviews: `1`
  - dismiss stale reviews: `true`
- Require conversation resolution: `true`
- Require status checks:
  - `Frontend CI`
  - `Backend CI`
  - strict mode: `true`
- Enforce admins: `true`
- Require linear history: `true`
- Allow force pushes: `false`
- Allow deletions: `false`

## Command outcome

- GitHub API returned protection objects for both branches with the expected settings.

## Result

- PR-only policy is now technically enforced at repository level for `dev` and `main`.
