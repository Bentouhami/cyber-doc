# Baseline compliance checklist

Reference baseline: `.codex/prompts/ASDHO-CONNECT_BASELINE.md`

## Architecture

- [ ] No business logic in UI/components
- [ ] Frontend flow respected (pages/components -> services -> API routes)
- [ ] Backend flow respected (API Platform -> services -> repositories -> Doctrine)
- [ ] No direct entity exposure in API

## Security

- [ ] Operation-level security rules defined
- [ ] Serialization groups reviewed (least privilege)
- [ ] No sensitive data in output/logs

## Data contracts

- [ ] DTOs explicit and validated
- [ ] Zod schemas aligned with backend DTOs
- [ ] Types/enums/nullability consistent

## Documentation / PlantUML

- [ ] Docs updated under /Documentation
- [ ] Relevant PlantUML diagrams updated

## Scripting (if applicable)

- [ ] PowerShell + Bash variants provided
- [ ] Safe-by-default behavior (dry-run/confirmation)

## CI / Testing

- [ ] Lint/typecheck/tests run or status recorded
- [ ] Known failures acknowledged with follow-up

## Output policy

- [ ] Silent writer rules followed
