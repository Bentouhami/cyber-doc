# اشهــــــــــــاد (Template: `ashhad`) ✅

**Filename:** `اشهــــــــــــاد.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

General attestation template with identity fields and signature.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ا` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `signature` | `اشهــــــــــــاد انا الموقع اسفله` | auto / long text | `signature` | true | type: signature | no |
| `address` | `اشهــــــــــــاد انا الموقع اسفله` | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- `cin`: missing FR label

## Assets 📂

- `tmp/template-extraction/fixed/ashhad/template.json`
- `tmp/template-extraction/fixed/ashhad/fields.csv`
- `tmp/template-extraction/fixed/ashhad/locales.ar.json`
- `tmp/template-extraction/fixed/ashhad/locales.fr.json`
- `tmp/template-extraction/fixed/ashhad/prisma-seed.ts`

---
**Next steps:** Translate `cin` label to FR and optionally split address into subfields (street/city).
