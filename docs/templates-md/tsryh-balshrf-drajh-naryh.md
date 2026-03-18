# تصريح بالشرف (Template: `tsryh-balshrf-drajh-naryh`) ✅

**Filename:** `تصريح بالشرف دراجة نارية.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.84

## Summary 🔍

Affidavit of ownership for a motorcycle with vehicle details.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ت` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `signature` | `تصريح بالشرفأنا الموقعة أسفله` | auto / long text | `signature` | true | type: signature | no |

## Review Flags ⚠️

- `cin`: missing FR label

## Assets 📂

- `tmp/template-extraction/fixed/tsryh-balshrf-drajh-naryh/template.json`
- `tmp/template-extraction/fixed/tsryh-balshrf-drajh-naryh/fields.csv`
- `tmp/template-extraction/fixed/tsryh-balshrf-drajh-naryh/locales.ar.json`
- `tmp/template-extraction/fixed/tsryh-balshrf-drajh-naryh/locales.fr.json`
- `tmp/template-extraction/fixed/tsryh-balshrf-drajh-naryh/prisma-seed.ts`

---
**Next steps:** Extract discrete vehicle fields (registration, frame number) and add FR labels.
