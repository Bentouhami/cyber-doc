---
name: asdhoconnect-api-platform-resource-builder
description: Generate Symfony API Platform resource skeletons with DTOs, validation, serialization groups, and security rules following ASDHO-CONNECT conventions.
metadata:
  short-description: Scaffold API Platform resources with DTOs and security
---

# API Platform Resource Builder

## Scope

- Doctrine entity or read model.
- Input/Output DTOs and mappers.
- Validation constraints.
- Serialization groups and operations.
- Security expressions per operation.

## Workflow

1. Identify resource and persistence needs.
2. Create DTOs and validation rules.
3. Add ApiResource with operations and groups.
4. Implement state provider/processor if needed.
5. Ensure repository usage only in services.

## Output

- File list and minimal skeletons.
- Security rule matrix by operation.

## Safety

- Never expose entities without groups.
- Never default to public operations.
- Never embed business logic in controllers.

## Definition of Done

- [ ] DTOs defined with validation.
- [ ] Groups assigned for read/write.
- [ ] Operations scoped with security rules.
- [ ] Service layer used for business logic.

## References

See `references/security-matrix.md`.
