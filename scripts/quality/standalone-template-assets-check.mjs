import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";

function classifyTemplateAssets(files) {
  const docx = files
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file.includes("templates_docs/") && file.toLowerCase().endsWith(".docx"));
  return {
    docx,
    raw: docx.filter((file) => !file.includes("templates_docs/sanitized/")),
  };
}

assert.deepEqual(
  classifyTemplateAssets(["templates_docs/sanitized/a.docx", "templates_docs/private.docx"]),
  {
    docx: ["templates_docs/sanitized/a.docx", "templates_docs/private.docx"],
    raw: ["templates_docs/private.docx"],
  },
);

const root = process.cwd();
const buildDirectory = process.env.CYBERDOC_NEXT_DIST_DIR?.trim() || ".next";
const standaloneRoot = path.join(root, buildDirectory, "standalone");
const sanitizedRoot = path.join(root, "templates_docs", "sanitized");
const packaged = classifyTemplateAssets(await readdir(standaloneRoot, { recursive: true }));
const expected = (await readdir(sanitizedRoot)).filter((file) => file.toLowerCase().endsWith(".docx"));

assert.deepEqual(packaged.raw, [], `Raw template assets packaged: ${JSON.stringify(packaged.raw)}`);
assert.equal(packaged.docx.length, expected.length, "Standalone template asset count mismatch");

console.log(`Standalone template assets: ${packaged.docx.length}/${expected.length} sanitized DOCX; 0 raw.`);
