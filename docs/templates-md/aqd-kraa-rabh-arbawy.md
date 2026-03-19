# عــــــــــــقد كـــــــــــــــراء (Template: `aqd-kraa-rabh-arbawy`) ✅

**Filename:** `عقد كراء رابح عرباوي.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Rental contract template with parties, duration and rent amount.

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ع` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$ | **yes** |
| `amount` | long fused Arabic paragraph (contains parties & amount) | auto / long text | `amount` | true | min 0, decimals 2 | no |
| `address` | long fused Arabic paragraph | auto / long text | `multiline` | false | maxLength 500 | no |

## Review Flags ⚠️

- `cin`: missing FR label (translation required)

## Assets 📂

- `tmp/template-extraction/fixed/aqd-kraa-rabh-arbawy/template.json`
- `tmp/template-extraction/fixed/aqd-kraa-rabh-arbawy/fields.csv`
- `tmp/template-extraction/fixed/aqd-kraa-rabh-arbawy/locales.ar.json`
- `tmp/template-extraction/fixed/aqd-kraa-rabh-arbawy/locales.fr.json`
- `tmp/template-extraction/fixed/aqd-kraa-rabh-arbawy/prisma-seed.ts`

---
**Next steps:** Human review to split fused party/description text into separate fields (e.g., partyName, partyAddress, rent, deposit). 💡
