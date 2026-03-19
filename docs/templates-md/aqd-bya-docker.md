# عقد بيع دراجة نارية (Template: `aqd-bya-docker`) ✅

**Filename:** `عقد بيع DOCKER.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Sale of motorcycle contract. Suggested excerpt:

> عقد بيع دراجة نارية بين الموقعين أسفله ...

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ع` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `date` | `عقد بيع دراجة نارية بين الموقعين أسفله` | auto / long text | `date` | true | format dd/MM/yyyy | no |
| `signature` | `عقد بيع دراجة نارية بين الموقعين أسفله` | auto / long text | `signature` | true | type: signature | no |

## Review Flags ⚠️

- `cin`: missing FR label (needs human translation)

## Assets 📂

- `tmp/template-extraction/fixed/aqd-bya-docker/template.json`
- `tmp/template-extraction/fixed/aqd-bya-docker/fields.csv`
- `tmp/template-extraction/fixed/aqd-bya-docker/locales.ar.json`
- `tmp/template-extraction/fixed/aqd-bya-docker/locales.fr.json`
- `tmp/template-extraction/fixed/aqd-bya-docker/prisma-seed.ts`

---
**Next steps:** Add FR labels for `cin`, split long descriptive labels into concise field labels, confirm date format. 🔧
