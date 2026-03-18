#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const translate = require("translate");
translate.engine = "google";
translate.key = process.env.GOOGLE_API_KEY || "";

const IN_DIR = path.resolve(__dirname, "../tmp/template-extraction");
const OUT_DIR = path.resolve(__dirname, "../tmp/template-extraction/fixed");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function toKey(s) {
  if (!s) return "field";
  const t = s
    .replace(/[:.(),"/\n\t]/g, " ")
    .trim()
    .slice(0, 40);
  let k = slugify(t, { lower: true, strict: true });
  if (!k) k = "field";
  k = k.replace(/-/g, "_");
  // ensure it starts with letter
  if (!/^[a-z]/.test(k)) k = "f_" + k;
  return k;
}

function addValidation(field) {
  const v = { required: !!field.required };
  switch (field.type) {
    case "cin":
      v.regex = "^[A-Z0-9s-]{3,20}$";
      v.maxLength = 20;
      break;
    case "phone":
      v.regex = "^\\+?[0-9\\s()-]{6,20}$";
      break;
    case "date":
      v.format = "dd/MM/yyyy";
      break;
    case "amount":
      v.min = 0;
      v.decimals = 2;
      break;
    case "signature":
      v.type = "signature";
      break;
    default:
      v.maxLength = 500;
  }
  field.validation = { ...field.validation, ...v };
}

async function translateIfNeeded(arText) {
  if (!arText) return { fr: null, autoTranslated: false };
  try {
    const res = await translate(arText, { from: "ar", to: "fr" });
    // if it's same as input or empty, skip
    const autoTranslated =
      res && res.trim().length > 0 && res.trim() !== arText.trim();
    return { fr: res, autoTranslated };
  } catch (e) {
    return { fr: null, autoTranslated: false };
  }
}

function splitComposite(field) {
  // heuristics: if label_ar contains 'رقم' and also names/dates, split CIN and name
  const text = (field.label_ar || "") + "\n" + (field.label_fr || "");
  const results = [field];
  if (
    /رقم\s*ال?بطاقة|بطاقة التعريف|CIN|CNIE|num(ero)?\s*carte/i.test(text) &&
    /الاسم|nom|name/i.test(text)
  ) {
    // create separate name and cin fields
    const nameKey = toKey(field.label_ar || "name");
    const cinKey = toKey((field.label_ar || "cin") + "_num");
    const nameField = {
      ...field,
      key: nameKey,
      label_ar:
        (field.label_ar && field.label_ar.split(/[0-9]/)[0].slice(0, 80)) ||
        "الاسم",
      label_fr: null,
      type: "text",
      required: true,
    };
    const cinField = {
      ...field,
      key: cinKey,
      label_ar: "رقم البطاقة",
      label_fr: null,
      type: "cin",
      required: true,
    };
    nameField.notes = (nameField.notes || "") + " split_from_composite";
    cinField.notes = (cinField.notes || "") + " split_from_composite";
    return [nameField, cinField];
  }
  return results;
}

(async function main() {
  const entries = fs
    .readdirSync(IN_DIR)
    .filter((d) => fs.statSync(path.join(IN_DIR, d)).isDirectory());
  const report = { totalTemplates: entries.length, templates: [] };

  for (const dir of entries) {
    if (dir === "fixed") continue;
    const base = path.join(IN_DIR, dir);
    const jsonPath = path.join(base, "template.json");
    if (!fs.existsSync(jsonPath)) continue;
    const j = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    const outBase = path.join(OUT_DIR, dir);
    if (!fs.existsSync(outBase)) fs.mkdirSync(outBase, { recursive: true });

    const fixed = JSON.parse(JSON.stringify(j));
    fixed.reviewFlags = fixed.reviewFlags || [];
    fixed.typos = fixed.typos || [];

    const newFields = [];
    for (const f of fixed.fields) {
      // normalize key
      let key = f.key;
      if (!/^[a-z0-9_]+$/.test(key))
        key = toKey(f.key || f.label_ar || f.label_fr || f.example || "field");

      // ensure label_ar and label_fr
      let label_ar = f.label_ar || null;
      let label_fr = f.label_fr || null;

      // if label is long > 80 chars, try to extract short candidate using heuristics
      const shortCandidate = (label_ar || label_fr || f.notes || "")
        .split(/\.|،|,|:/)[0]
        .slice(0, 80)
        .trim();
      if ((!label_ar || label_ar.length > 80) && shortCandidate)
        label_ar = shortCandidate;

      // split composite if needed
      const split = splitComposite({ ...f, key, label_ar, label_fr });
      for (const sf of split) {
        // recalc key
        const sfKey =
          sf.key && sf.key !== f.key
            ? sf.key
            : toKey(
                sf.key || sf.label_ar || sf.label_fr || sf.example || "field",
              );
        sf.key = sfKey;
        // labels
        sf.label_ar = sf.label_ar || label_ar || "";
        sf.label_fr = sf.label_fr || label_fr || null;
        // add validation
        addValidation(sf);
        // translation
        if (!sf.label_fr) {
          const { fr, autoTranslated } = await translateIfNeeded(sf.label_ar);
          if (fr) {
            sf.label_fr = fr;
            sf.notes =
              (sf.notes || "") + (autoTranslated ? " auto-translated" : "");
            if (autoTranslated) sf.needsReview = true;
          } else {
            sf.needsReview = true;
            fixed.reviewFlags.push({
              fieldKey: sf.key,
              reason: "missing_fr_label",
            });
          }
        }
        // prune long labels
        if (sf.label_ar && sf.label_ar.length > 140)
          sf.label_ar = sf.label_ar.slice(0, 140) + "...";
        // set required default
        if (typeof sf.required !== "boolean") sf.required = !!sf.required;
        // confidence bump
        sf.confidence = Math.min(
          0.95,
          (sf.confidence || fixed.confidence || 0.6) + 0.2,
        );
        newFields.push(sf);
      }
    }

    // deduplicate by key
    const dedup = {};
    newFields.forEach((f) => {
      if (!dedup[f.key]) dedup[f.key] = f;
      else {
        // merge required, notes
        dedup[f.key].required = dedup[f.key].required || f.required;
        dedup[f.key].notes = (dedup[f.key].notes || "") + ";" + (f.notes || "");
        if (!dedup[f.key].label_fr && f.label_fr)
          dedup[f.key].label_fr = f.label_fr;
        if (!dedup[f.key].label_ar && f.label_ar)
          dedup[f.key].label_ar = f.label_ar;
      }
    });

    fixed.fields = Object.values(dedup);
    fixed.confidence = Math.min(0.95, (fixed.confidence || 0.6) + 0.2);

    // write fixed JSON
    fs.writeFileSync(
      path.join(outBase, "template.json"),
      JSON.stringify(fixed, null, 2),
      "utf-8",
    );

    // write CSV
    const csvLines = [
      "templateId,key,label_ar,label_fr,type,required,example,validation,notes,needsReview",
    ];
    fixed.fields.forEach((ff) =>
      csvLines.push(
        [
          fixed.templateId,
          ff.key,
          ff.label_ar || "",
          ff.label_fr || "",
          ff.type,
          ff.required,
          ff.example || "",
          JSON.stringify(ff.validation || {}),
          ff.notes || "",
          ff.needsReview || false,
        ]
          .map((v) => '"' + String(v || "").replace(/"/g, '""') + '"')
          .join(","),
      ),
    );
    fs.writeFileSync(
      path.join(outBase, "fields.csv"),
      csvLines.join("\n"),
      "utf-8",
    );

    // locales
    const locAr = {};
    const locFr = {};
    fixed.fields.forEach((ff) => {
      locAr[`template.${fixed.templateId}.field.${ff.key}.label`] =
        ff.label_ar || ff.label_fr || ff.key;
      locAr[`template.${fixed.templateId}.field.${ff.key}.placeholder`] =
        ff.label_ar ? `أدخل ${ff.label_ar}` : `Enter ${ff.label_fr || ff.key}`;
      locFr[`template.${fixed.templateId}.field.${ff.key}.label`] =
        ff.label_fr || ff.label_ar || ff.key;
      locFr[`template.${fixed.templateId}.field.${ff.key}.placeholder`] =
        ff.label_fr
          ? `Entrez ${ff.label_fr}`
          : `Enter ${ff.label_ar || ff.key}`;
    });
    fs.writeFileSync(
      path.join(outBase, "locales.ar.json"),
      JSON.stringify(locAr, null, 2),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(outBase, "locales.fr.json"),
      JSON.stringify(locFr, null, 2),
      "utf-8",
    );

    // prisma seed
    const seedLines = [];
    seedLines.push("// Prisma seed snippet for template " + fixed.templateId);
    seedLines.push("await prisma.documentTemplate.create({");
    seedLines.push("  data: {");
    seedLines.push(`    id: '${fixed.templateId}',`);
    seedLines.push(`    slug: '${fixed.templateId}',`);
    seedLines.push(
      `    title: '${(
        fixed.title.ar ||
        fixed.title.fr ||
        fixed.fileName
      ).replace(/'/g, "\\'")}',`,
    );
    seedLines.push('    locale: "ar-MA",');
    seedLines.push("    isActive: true,");
    seedLines.push("    fields: { create: [");
    fixed.fields.forEach((ff) => {
      seedLines.push("      {");
      seedLines.push(`        id: '${fixed.templateId}_${ff.key}',`);
      seedLines.push(`        fieldName: '${ff.key}',`);
      seedLines.push(
        `        fieldLabel: '${(ff.label_fr || ff.label_ar || ff.key).replace(
          /'/g,
          "\\'",
        )}',`,
      );
      seedLines.push(
        `        fieldLabelAr: '${(ff.label_ar || "").replace(/'/g, "\\'")}',`,
      );
      seedLines.push(`        isRequired: ${ff.required},`);
      seedLines.push(`        fieldType: '${ff.type}',`);
      seedLines.push("      },");
    });
    seedLines.push("    ] }");
    seedLines.push("  }");
    seedLines.push("});");
    fs.writeFileSync(
      path.join(outBase, "prisma-seed.ts"),
      seedLines.join("\n"),
      "utf-8",
    );

    report.templates.push({
      templateId: fixed.templateId,
      fileName: fixed.fileName,
      fieldsCount: fixed.fields.length,
      confidence: fixed.confidence,
    });
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "clean-report.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );
  console.log(
    "Cleaning complete. Report saved to",
    path.join(OUT_DIR, "clean-report.json"),
  );
})();
