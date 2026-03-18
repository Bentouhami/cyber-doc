# Baseline compliance checklist

Reference baseline: `skills-manifest.json` + active project conventions.

## Architecture

- [ ] No business logic in UI/components
- [ ] Frontend flow respected (pages/components -> services -> API routes)
- [ ] Backend flow respected (route handlers -> server services -> Prisma/data layer)
- [ ] No direct data model leakage in API responses

## Security

- [ ] Route/method-level security rules defined
- [ ] Response fields reviewed (least privilege)
- [ ] No sensitive data in output/logs

## Data contracts

- [ ] DTOs explicit and validated
- [ ] Zod schemas aligned with service/route contracts
- [ ] Types/enums/nullability consistent

## Documentation / PlantUML

- [ ] Docs updated under `/docs`
- [ ] Relevant PlantUML diagrams updated

## Scripting (if applicable)

- [ ] PowerShell + Bash variants provided
- [ ] Safe-by-default behavior (dry-run/confirmation)

## CI / Testing

- [ ] Lint/typecheck/tests run or status recorded
- [ ] Known failures acknowledged with follow-up

## Output policy

- [ ] Silent writer rules followed
