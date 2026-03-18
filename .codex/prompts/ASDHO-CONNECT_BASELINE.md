# ASDHO-CONNECT — Codex Baseline (V2)

This file defines the global engineering rules for ASDHO-CONNECT.
All Codex skills, prompts, and tasks MUST comply with this baseline.

---

## Architecture rules

- UI / pages / components must not contain business logic.
  Allowed: presentation logic, state wiring, form handling only.

- Frontend flow:
  pages/components → frontend-services → API routes (Next.js).

- Backend flow:
  API Platform → backend-services → repositories → Doctrine.

- DTOs and API contracts must be explicit and validated.
  No implicit entity exposure.

- Avoid one-off patterns and shortcuts.
  Favor reusable services, shared utilities, and established conventions.

---

## Security standards

- A security review is mandatory for any authentication, authorization,
  or data exposure change.

- API Platform operations MUST define explicit security rules
  (`security`, `securityPostDenormalize`, voters if applicable).

- Serialization groups must follow the principle of least privilege.

- Never include secrets, tokens, credentials, or internal identifiers in output.

---

## Data contracts

- Zod schemas define frontend validation and client-side contracts.

- Backend DTOs map to Doctrine entities via explicit mappers.
  Entities must never be exposed directly.

- Types must align across layers:
  fields, nullability, enums, defaults.

- Any contract mismatch must be reported and fixed
  before feature completion.

---

## Documentation and PlantUML

- All documentation must be created or updated under `/Documentation`
  using the established folder structure.

- Any data model or flow change requires updating the corresponding
  PlantUML diagrams.

- Documentation must include, when applicable:
  roles, validations, errors, endpoints, and business rules.

---

## Scripting standards

- Provide both PowerShell and Bash variants for repeatable tasks.

- Scripts must be safe by default:
  dry-run mode or explicit confirmation when relevant.

- Avoid destructive commands unless explicitly requested.

---

## Skill usage

- Use `context7` for official and framework documentation.

- Use `asdhoconnect-architecture-guardian`
  for boundary and layer responsibility checks.

- Use `asdhoconnect-security-review`
  for authentication, authorization, and exposure changes.

- Use `asdhoconnect-contract-validator`
  for DTO, Zod, and type alignment.

- Use `asdhoconnect-docs-diagrams`
  for documentation and PlantUML updates.

- Use `asdhoconnect-task-scripter`
  for automation and repeatable workflows.

- Use `asdhoconnect-baseline-compliance`
  as a final compliance gate before completion.

Governance: see `.codex/skills/_GOVERNANCE.md`.

Skills are mandatory when their scope matches the task.

---

## Daily workflow

1. Plan
2. Implement
3. Validate
4. Secure
5. Document
6. CI
7. Compliance (run asdhoconnect-baseline-compliance)

---

## Output policy (silent writer)

When finishing any task that creates, updates, renames, or deletes files:

- Never print file contents unless explicitly requested.
- Do not duplicate code already written to disk.
- Do not use absolute paths.
- Do not use markdown links or code blocks.
- Do not repeat the same file path multiple times.

Output format rules:

- Output only a summary section titled exactly:

FILES CREATED / UPDATED / DELETED

- One file per line.
- Paths must be relative to the repository root.
- Wrap each file path in backticks (`) so it is clickable in VS Code.
- Optional short purpose after " — ".

Example:

FILES CREATED / UPDATED / DELETED

`.codex/skills/asdhoconnect-docs-diagrams/SKILL.md` — updated skill definition
`.codex/skills/asdhoconnect-docs-diagrams/references/feature-template.md` — new documentation template

If no files were changed, output:

NO FILES CHANGED
