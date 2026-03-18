# Templates (cleaned & normalized) 📚

This folder contains human-readable, cleaned and normalized markdown summaries for each extracted template located in `tmp/template-extraction/fixed/`.

## What you'll find ✅

- One markdown file per template (e.g., `aatraf-bdyn-alzrwaly.md`) summarizing:
  - Title, locale, confidence score
  - Field list with types, validations, and review flags
  - Links to the exact artifacts (`template.json`, `fields.csv`, `locales.*.json`, `prisma-seed.ts`)

## Suggested next steps ⚠️

1. Review fields marked **Needs Review** (mostly missing FR labels).  
2. Split fused/long labels into discrete fields (e.g., partyName, partyAddress, rent) where applicable.  
3. Finalize FR translations for labels and examples.  
4. Approve templates to include in DB seed and import endpoint.  

---
If you want, I can:  

- Open a PR that adds these markdown files and the cleaned artifacts to the repo (recommended), or  
- Start implementing the template import API + DB seeding flows and unit tests.  

What do you want me to do next? 🔧
