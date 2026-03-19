# وكــــــــــالة (Template: `wkalh-krym-hsany`) ✅

**Filename:** `وكالة كريم حساني.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Power of attorney template delegating powers to an agent for administrative acts.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `و` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `signature` | `وكــــــــــالة أنا الموقع أسفله` | auto / long text | `signature` | true | type: signature | no |
| `address` | `وكــــــــــالة أنا الموقع أسفله` | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- `cin`: missing FR label

## Assets 📂

- `tmp/template-extraction/fixed/wkalh-krym-hsany/template.json`
- `tmp/template-extraction/fixed/wkalh-krym-hsany/fields.csv`
- `tmp/template-extraction/fixed/wkalh-krym-hsany/locales.ar.json`
- `tmp/template-extraction/fixed/wkalh-krym-hsany/locales.fr.json`
- `tmp/template-extraction/fixed/wkalh-krym-hsany/prisma-seed.ts`

---
**Next steps:** Add FR translations; consider extracting `agentName`, `agentCin`, and explicit `powers` field.
