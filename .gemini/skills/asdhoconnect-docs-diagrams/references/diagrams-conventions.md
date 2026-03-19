# Diagram conventions

## UML conventions

- Use-case: actors, system boundary, goals. One diagram per module or feature.
- Sequence: main and alternate flows; include auth and error paths.
- Component: frontend, backend, services, data stores, external systems.
- Class: only when design details are needed; keep aligned to code.

## Data model conventions

- MCD (conceptual):
  - No types, no PK/FK.
  - Only entities, attributes, and cardinalities.
- MLD (logical):
  - Show PK/FK and logical constraints.
  - No physical types or indexes.
- MPD (physical):
  - Include types, enums, indexes, and join tables.
  - Indicate NOT NULL and UNIQUE where applicable.

## Naming conventions

- Use snake_case for physical table/column names.
- Use PascalCase for conceptual entity names.
- Use consistent role labels for associations.

## File naming conventions

- UML: `SQ_XX_<Name>.puml`, `UC_XX_<Name>.puml`, `CMP_<Name>.puml`.
- Data model: `MCD_<Module>_Modular_v2.puml`, `MLD_<Module>_Modular_v2.puml`, `MPD_<Module>_Modular_v2.puml`.

## Update rules

- Update UML diagrams when flows or roles change.
- Update MCD/MLD/MPD when schema or relations change.
- Always cross-reference code and migrations.

## Assumptions and traceability

- Explicitly list assumptions in docs.
- Link to relevant entities, DTOs, and migrations.
