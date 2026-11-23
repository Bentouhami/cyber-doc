import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

function readTemplateDrafts(seed) {
  const starts = [...seed.matchAll(/\r?\n  \{\r?\n    slug: "([^"]+)"/g)];
  return starts.flatMap((start, index) => {
    const block = seed.slice(start.index, starts[index + 1]?.index ?? seed.length);
    const content = block.match(/\r?\n    contentHtml:\s*`([\s\S]*?)`\.trim\(\),/)?.[1];
    return content ? [{ slug: start[1], content: content.trim() }] : [];
  });
}

assert.deepEqual(readTemplateDrafts('\n  {\n    slug: "a",\n    contentHtml: `<p>{{a.name}}</p>`.trim(),\n  },'), [
  { slug: "a", content: "<p>{{a.name}}</p>" },
]);

const root = process.cwd();
const drafts = readTemplateDrafts(await readFile(path.join(root, "prisma", "seed.ts"), "utf8"));
assert.equal(drafts.length, 13, "Expected 13 tokenized template drafts");
assert.equal(new Set(drafts.map(({ slug }) => slug)).size, drafts.length, "Template slugs must be unique");

const outputDirectory = path.join(root, "templates_docs", "sanitized");
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "cyberdoc-template-assets-"));
await mkdir(outputDirectory, { recursive: true });

try {
  for (const { slug, content } of drafts) {
    assert.match(content, /{{\s*[\w.]+\s*}}/, `${slug} must contain placeholders`);
    const source = path.join(temporaryDirectory, `${slug}.html`);
    const output = path.join(outputDirectory, `${slug}.docx`);
    await writeFile(
      source,
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body>${content}</body></html>`,
      "utf8",
    );
    const conversion = spawnSync("pandoc", ["--from=html", "--to=docx", source, "-o", output], {
      encoding: "utf8",
    });
    assert.equal(conversion.status, 0, conversion.stderr || `pandoc failed for ${slug}`);
    const verification = spawnSync("pandoc", [output, "--to=plain"], { encoding: "utf8" });
    assert.equal(verification.status, 0, verification.stderr || `Unable to verify ${slug}`);
    assert.match(verification.stdout, /{{\s*[\w.]+\s*}}/, `${slug} lost its placeholders`);
    assert.doesNotMatch(
      verification.stdout,
      /(?:\b[A-Z]{1,3}\d{5,}\b|\b\d{6,}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/,
      `${slug} contains a literal identifier instead of a placeholder`,
    );
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Sanitized template assets: ${drafts.length}/${drafts.length} DOCX generated and verified.`);
