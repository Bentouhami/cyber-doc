# اعتـــــــــراف بديــن (Template: `aatraf-bdyn-alzrwaly`) ✅

**Filename:** `اعتـــــــــراف بديــن الزروالي.docx`  
**Locale:** `ar-MA`  
**Category:** `uncategorized`  
**Confidence (cleaned):** 0.86

## Summary 🔍

Short debt acknowledgement template. Suggested HTML excerpt:

> اعتـــــــــراف بديــن
> أنا الموقع أسفله: زروالي محمد، مغربي الجنسية ...

## Fields 🧾

| Key | Label (AR) | Label (FR) | Type | Required | Validation | Needs Review |
|---|---:|---|---:|---:|---|---:|
| `cin` | `ا` | _missing_ | `cin` | true | regex ^[A-Z0-9s-]{3,20}$, maxLength 20 | **yes** |
| `amount` | `اعتـــــــــراف بديــنأنا الموقع أسفله` | auto / long text | `amount` | true | min 0, decimals 2 | no |
| `signature` | `اعتـــــــــراف بديــنأنا الموقع أسفله` | auto / long text | `signature` | true | type: signature | no |

## Review Flags ⚠️

- `cin`: missing FR label (needs human translation/verification)

## Assets 📂

- `tmp/template-extraction/fixed/aatraf-bdyn-alzrwaly/template.json`
- `tmp/template-extraction/fixed/aatraf-bdyn-alzrwaly/fields.csv`
- `tmp/template-extraction/fixed/aatraf-bdyn-alzrwaly/locales.ar.json`
- `tmp/template-extraction/fixed/aatraf-bdyn-alzrwaly/locales.fr.json`
- `tmp/template-extraction/fixed/aatraf-bdyn-alzrwaly/prisma-seed.ts`

---
**Next steps:** Translate missing FR labels, verify long fused labels (may need splitting), confirm examples and amount formatting. 💡
