# الحـــــمد لله وحده (Template: `shkayh-0022`) ✅

**Filename:** `شكاية 0022.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Complaint letter to the municipality describing local sanitation/road issues.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `amount` | long Arabic header text (contains letter body) | auto / long text | `amount` | true | min 0, decimals 2 | no |
| `fullname` | same as above | auto / long text | `text` | true | maxLength 500 | no |
| `address` | same as above | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- none detected (fields are derived from letter body)

## Assets 📂

- `tmp/template-extraction/fixed/shkayh-0022/template.json`
- `tmp/template-extraction/fixed/shkayh-0022/fields.csv`
- `tmp/template-extraction/fixed/shkayh-0022/locales.ar.json`
- `tmp/template-extraction/fixed/shkayh-0022/locales.fr.json`
- `tmp/template-extraction/fixed/shkayh-0022/prisma-seed.ts`

---
**Next steps:** Split into explicit fields for `subject`, `date`, `complainantName`, `text` if needed for V0 structured use. 🧩
