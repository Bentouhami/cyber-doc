# تصريـــح بالشرف (Template: `ashhad-skn-zhyr-hsayny`) ✅

**Filename:** `اشهــــــاد سكن زهير حسايني.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Declaration of residence / honour statement.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ت` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `signature` | `تصريـــح بالشرفأنا الموقع أسفله` | auto / long text | `signature` | true | type: signature | no |
| `address` | `تصريـــح بالشرفأنا الموقع أسفله` | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- `cin`: missing FR label

## Assets 📂

- `tmp/template-extraction/fixed/ashhad-skn-zhyr-hsayny/template.json`
- `tmp/template-extraction/fixed/ashhad-skn-zhyr-hsayny/fields.csv`
- `tmp/template-extraction/fixed/ashhad-skn-zhyr-hsayny/locales.ar.json`
- `tmp/template-extraction/fixed/ashhad-skn-zhyr-hsayny/locales.fr.json`
- `tmp/template-extraction/fixed/ashhad-skn-zhyr-hsayny/prisma-seed.ts`

---
**Next steps:** Add FR labels and verify resident name/address fields.
