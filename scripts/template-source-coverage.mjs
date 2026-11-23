import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

function compareSources(sourceFiles, referencedFiles) {
  const references = new Set(referencedFiles);
  return {
    missing: sourceFiles.filter((file) => !references.has(file)),
    nonexistent: [...references].filter((file) => !sourceFiles.includes(file)),
    duplicates: referencedFiles.filter((file, index) => referencedFiles.indexOf(file) !== index),
  };
}

function readTemplateSources(seed) {
  const starts = [...seed.matchAll(/\r?\n  \{\r?\n    slug: "([^"]+)"/g)];
  return starts.flatMap((start, index) => {
    const block = seed.slice(start.index, starts[index + 1]?.index ?? seed.length);
    const file = block.match(/filePath:\s*"templates_docs\/sanitized\/([^"]+\.docx)"/)?.[1];
    return file ? [{ slug: start[1], file, hasContent: /\r?\n    contentHtml:\s*`/.test(block) }] : [];
  });
}

assert.deepEqual(compareSources(["a.docx", "b.docx"], ["a.docx", "a.docx", "c.docx"]), {
  missing: ["b.docx"],
  nonexistent: ["c.docx"],
  duplicates: ["a.docx"],
});
assert.deepEqual(readTemplateSources('\n  {\n    slug: "a",\n    contentHtml: `<p>x</p>`,\n    asset: { filePath: "templates_docs/sanitized/a.docx" },\n  },'), [
  { slug: "a", file: "a.docx", hasContent: true },
]);

const root = process.cwd();
const sourceFiles = (await readdir(path.join(root, "templates_docs"), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
  .map((entry) => entry.name)
  .sort();
const sanitizedFiles = (await readdir(path.join(root, "templates_docs", "sanitized")))
  .filter((file) => file.toLowerCase().endsWith(".docx"))
  .sort();
const seed = await readFile(path.join(root, "prisma", "seed.ts"), "utf8");
const templates = readTemplateSources(seed);
const referencedFiles = templates.map(({ file }) => file).sort();
const result = compareSources(sanitizedFiles, referencedFiles);
const templatesWithoutContent = templates.filter(({ hasContent }) => !hasContent).map(({ slug }) => slug);

assert.deepEqual(
  result,
  { missing: [], nonexistent: [], duplicates: [] },
  `Template source coverage mismatch: ${JSON.stringify(result)}`,
);
assert.equal(sourceFiles.length, templates.length, "Every inventoried legacy DOCX needs a sanitized template");
assert.deepEqual(
  templatesWithoutContent,
  [],
  `Template sources without tokenized HTML content: ${JSON.stringify(templatesWithoutContent)}`,
);

console.log(
  `Template source coverage: ${sourceFiles.length}/${sourceFiles.length} legacy DOCX inventoried; ${sanitizedFiles.length}/${sanitizedFiles.length} sanitized assets referenced with tokenized HTML.`,
);
