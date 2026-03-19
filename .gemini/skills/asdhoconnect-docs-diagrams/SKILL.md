---
name: asdhoconnect-docs-diagrams
description: Update ASDHO-CONNECT documentation and PlantUML diagrams using /Documentation as the single source of truth. Use for any feature, API, schema, migration, or ops change.
metadata:
  short-description: Docs and PlantUML updates for features, APIs, and data models
---

# Docs and Diagrams

## Scope

- Feature documentation (business + technical).
- UML diagrams: use-case, sequence, component, class (when relevant).
- Data model diagrams (Merise-like):
  - MCD: conceptual (no types, no PK/FK).
  - MLD: logical (PK/FK).
  - MPD: physical (types, enums, indexes, join tables).
- Documentation lives exclusively under /Documentation (except README pointers).

## When to use

- New or changed feature flow.
- New API endpoints or API Platform operations.
- Schema changes, migrations, or contract changes.
- Any change that affects roles, permissions, or data exposure.

## Workflow

1. Detect the change type (frontend/UI, API endpoint, auth/roles, DB/Doctrine, business rules, ops issue, ADR).
2. Select the correct target file(s) under /Documentation using the routing table.
3. Update only those files, or create the file if it is missing and belongs in the correct folder.
4. Update or generate required UML and data model diagrams in the correct diagrams folder.
5. Cross-reference code, migrations, and DTOs.
6. State assumptions explicitly when needed.
7. Follow the output policy in `.codex/prompts/ASDHO-CONNECT_BASELINE.md` (silent writer).

## Output

- Updated diagram files with paths.
- Feature doc with required sections completed.
- List of assumptions and references to code/migrations.

## Safety

- Never include secrets or tokens in docs.
- Never invent schema changes; reflect actual code/migrations.
- Always state assumptions when diagrams are inferred.
- Never write docs outside /Documentation (except README pointers).

## Do not

- Do not duplicate content across multiple docs.
- Do not create new documentation files outside the canonical /Documentation paths.
- Do not paste large code blocks unless explicitly requested.

## Definition of Done

- [ ] UML diagrams updated where relevant.
- [ ] MCD/MLD/MPD updated where relevant.
- [ ] Feature doc updated with roles, flows, and errors.
- [ ] Changes cross-referenced to code/migrations.
- [ ] Assumptions explicitly listed.
- [ ] Documentation stored only in /Documentation (except README pointers).

## References

See `references/feature-template.md`, `references/diagrams-conventions.md`, and `references/documentation-routing.md`.

## Output policy

When writing files, follow `.codex/prompts/ASDHO-CONNECT_BASELINE.md` and do not echo contents unless explicitly requested.
