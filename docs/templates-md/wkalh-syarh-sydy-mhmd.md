# وكــــــــالة (Template: `wkalh-syarh-sydy-mhmd`) ✅

**Filename:** `وكالة سيارة سيدي محمد.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Vehicle power of attorney including vehicle registration and frame details.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `و` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `signature` | `وكــــــــالة بين الموقعين أسفله` | auto / long text | `signature` | true | type: signature | no |
| `address` | `وكــــــــالة بين الموقعين أسفله` | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- `cin`: missing FR label

## Assets 📂

- `tmp/template-extraction/fixed/wkalh-syarh-sydy-mhmd/template.json`
- `tmp/template-extraction/fixed/wkalh-syarh-sydy-mhmd/fields.csv`
- `tmp/template-extraction/fixed/wkalh-syarh-sydy-mhmd/locales.ar.json`
- `tmp/template-extraction/fixed/wkalh-syarh-sydy-mhmd/locales.fr.json`
- `tmp/template-extraction/fixed/wkalh-syarh-sydy-mhmd/prisma-seed.ts`

---
**Next steps:** Extract discrete vehicle fields (registration, frame), add FR labels, and confirm passport number usage in agent identity.
