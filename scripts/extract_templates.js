#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const cheerio = require("cheerio");
const slugify = require("slugify");

const TEMPLATES_DIR = path.resolve(__dirname, "../templates_docs");
const OUT_DIR = path.resolve(__dirname, "../tmp/template-extraction");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function guessLocaleFromText(text) {
  // crude detection
  if (/\p{Script=Arabic}/u.test(text)) return "ar-MA";
  if (/[ÀÉÈÙÇâêîôûàéèù]/.test(text)) return "fr";
  return "ar-MA";
}

function slug(s) {
  return slugify(s.replace(/\.docx$/i, ""), { lower: true, strict: true });
}

function extractFieldsFromHtml(html) {
  const $ = cheerio.load(html);
  const text = $.root().text();

  const fields = [];
  // 1. find mustache-like placeholders
  const moustacheMatches = html.match(/{{\s*([A-Za-z0-9_\- ]+)\s*}}/g) || [];
  moustacheMatches.forEach((m) => {
    const key = m.replace(/[{}]/g, "").trim();
    fields.push({
      key: slugify(key, { lower: true, strict: true }),
      label_candidate: key,
      type: "text",
      required: false,
      detectedBy: "placeholder",
    });
  });

  // 2. simple heuristics via keywords
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, i) => {
    // CIN
    if (/CIN|CNIE|C.I.N|بطاقة/i.test(line)) {
      fields.push({
        key: "cin",
        label_candidate: (line.match(/\p{Script=Arabic}|CIN|CNIE|بطاقة/iu) || [
          line,
        ])[0],
        type: "cin",
        required: true,
        detectedBy: "keyword",
      });
    }
    // phone
    if (
      /\+?\d[\d\s()\-]{6,}\d/.test(line) &&
      (/tel|phone|الهاتف|هاتف/i.test(line) || line.length < 40)
    ) {
      fields.push({
        key: "phone",
        label_candidate: line,
        type: "phone",
        required: false,
        detectedBy: "regex",
      });
    }
    // amounts
    if (
      /\bMAD\b|د\.م|DH|dh|درهم/i.test(line) ||
      /\d+\s*(?:MAD|د\.م|DH)/i.test(line)
    ) {
      fields.push({
        key: "amount",
        label_candidate: line,
        type: "amount",
        required: true,
        detectedBy: "currency",
      });
    }
    // date
    if (
      /\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}\b/.test(line) ||
      /\b(date|تاريخ)\b/i.test(line)
    ) {
      fields.push({
        key: "date",
        label_candidate: line,
        type: "date",
        required: true,
        detectedBy: "regex",
      });
    }
    // signature
    if (/signature|التوقيع|وقع/i.test(line)) {
      fields.push({
        key: "signature",
        label_candidate: line,
        type: "signature",
        required: true,
        detectedBy: "keyword",
      });
    }
    // name
    if (/nom|الاسم|الاسم الكامل|name/i.test(line)) {
      fields.push({
        key: "full_name",
        label_candidate: line,
        type: "text",
        required: true,
        detectedBy: "keyword",
      });
    }
    // address
    if (/adresse|العنوان|address/i.test(line)) {
      fields.push({
        key: "address",
        label_candidate: line,
        type: "multiline",
        required: false,
        detectedBy: "keyword",
      });
    }
  });

  // deduplicate by key
  const uniq = {};
  fields.forEach((f) => {
    const k = f.key;
    if (!uniq[k]) uniq[k] = f;
    else {
      // merge notes
      uniq[k].detectedBy += "," + f.detectedBy;
    }
  });

  return Object.values(uniq).map((f) => {
    // enrich with labels and placeholders
    const label_ar = /\p{Script=Arabic}/u.test(f.label_candidate)
      ? f.label_candidate
      : null;
    const label_fr = /[A-Za-zÀ-ÿ]/.test(f.label_candidate)
      ? f.label_candidate
      : null;
    return {
      key: f.key,
      label_ar,
      label_fr,
      type: f.type,
      required: !!f.required,
      example:
        f.type === "date"
          ? "01/01/2025"
          : f.type === "amount"
          ? "1000"
          : f.type === "phone"
          ? "+212600000000"
          : "Example",
      validation: {},
      notes: `detectedBy=${f.detectedBy}`,
    };
  });
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const htmlRes = await mammoth
    .convertToHtml({ path: filePath })
    .catch((e) => ({ value: "", messages: [e.message] }));
  const html = htmlRes.value || "";
  const text = html.replace(/<[^>]+>/g, "\n").replace(/\n\s+\n/g, "\n");
  const locale = guessLocaleFromText(text);
  const titleMatch = (
    text.split("\n").find((l) => l.trim().length > 6) || fileName
  ).trim();
  const slugId = slug(fileName);

  const fields = extractFieldsFromHtml(html);

  const staticSections = [];
  // naively split by headings (h1..h3)
  const $ = cheerio.load(html);
  $("h1,h2,h3").each((i, el) => {
    const id = "section_" + i;
    staticSections.push({ id, text: $(el).text().trim().slice(0, 400) });
  });

  const data = {
    fileName,
    templateId: slugId,
    title: {
      ar: /\p{Script=Arabic}/u.test(titleMatch) ? titleMatch : null,
      fr: /[A-Za-zÀ-ÿ]/.test(titleMatch) ? titleMatch : null,
    },
    locale,
    category: "uncategorized",
    tags: [],
    staticSections,
    fields,
    suggested_template_html: html,
    typos: [],
    reviewFlags: [],
    confidence: Math.max(0.5, Math.min(0.95, 0.6 + fields.length * 0.02)),
  };

  return data;
}

(async function main() {
  const files = fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".docx"));
  console.log("Found", files.length, "DOCX files");

  const results = [];
  for (const f of files) {
    const p = path.join(TEMPLATES_DIR, f);
    process.stdout.write("Processing " + f + "... ");
    try {
      const r = await processFile(p);
      results.push(r);
      const outBase = path.join(OUT_DIR, r.templateId);
      if (!fs.existsSync(outBase)) fs.mkdirSync(outBase, { recursive: true });
      fs.writeFileSync(
        path.join(outBase, "template.json"),
        JSON.stringify(r, null, 2),
        "utf-8",
      );
      // write csv fields
      const csvLines = [
        "templateId,key,label_ar,label_fr,type,required,example,notes",
      ];
      r.fields.forEach((ff) =>
        csvLines.push(
          [
            r.templateId,
            ff.key,
            ff.label_ar || "",
            ff.label_fr || "",
            ff.type,
            ff.required,
            ff.example,
            ff.notes,
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
      // i18n
      const locAr = {};
      const locFr = {};
      r.fields.forEach((ff) => {
        locAr[`template.${r.templateId}.field.${ff.key}.label`] =
          ff.label_ar || ff.label_fr || ff.key;
        locAr[`template.${r.templateId}.field.${ff.key}.placeholder`] =
          ff.label_ar
            ? `أدخل ${ff.label_ar}`
            : `Enter ${ff.label_fr || ff.key}`;
        locFr[`template.${r.templateId}.field.${ff.key}.label`] =
          ff.label_fr || ff.label_ar || ff.key;
        locFr[`template.${r.templateId}.field.${ff.key}.placeholder`] =
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

      // prisma seed snippet
      const seedLines = [];
      seedLines.push("// Prisma seed snippet for template " + r.templateId);
      seedLines.push("await prisma.documentTemplate.create({");
      seedLines.push("  data: {");
      seedLines.push(`    id: '${r.templateId}',`);
      seedLines.push(`    slug: '${r.templateId}',`);
      seedLines.push(
        `    title: '${(r.title.ar || r.title.fr || r.fileName).replace(
          /'/g,
          "\\'",
        )}',`,
      );
      seedLines.push("    locale: 'ar-MA',");
      seedLines.push("    isActive: true,");
      seedLines.push("    fields: { create: [");
      r.fields.forEach((ff) => {
        seedLines.push("      {");
        seedLines.push(`        id: '${r.templateId}_${ff.key}',`);
        seedLines.push(`        fieldName: '${ff.key}',`);
        seedLines.push(
          `        fieldLabel: '${(
            ff.label_fr ||
            ff.label_ar ||
            ff.key
          ).replace(/'/g, "\\'")}',`,
        );
        seedLines.push(
          `        fieldLabelAr: '${(ff.label_ar || "").replace(
            /'/g,
            "\\'",
          )}',`,
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

      console.log("done");
    } catch (e) {
      console.error("error", e.message);
    }
  }

  // summary file
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(
      {
        count: results.length,
        results: results.map((r) => ({
          templateId: r.templateId,
          fileName: r.fileName,
          fieldsCount: r.fields.length,
        })),
      },
      null,
      2,
    ),
  );

  console.log("Extraction complete. Outputs saved in", OUT_DIR);
})();
