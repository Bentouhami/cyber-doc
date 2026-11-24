import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildUploadedTemplateAssetPath,
  deleteUploadedTemplateAsset,
  isPersistentTemplateAssetPath,
  readTemplateAssetFile,
  resolveTemplateAssetFile,
  writeUploadedTemplateAsset,
} from "../../services/templateAssetStorageService";

test("routes uploaded template assets to persistent storage", () => {
  assert.equal(buildUploadedTemplateAssetPath("draft.docx"), "template-assets/draft.docx");
  assert.equal(isPersistentTemplateAssetPath("template-assets/draft.docx"), true);
  assert.equal(isPersistentTemplateAssetPath("template-requests/legacy.docx"), true);
  assert.equal(isPersistentTemplateAssetPath("templates_docs/seed.docx"), false);
});

test("resolves only sanitized packaged template assets", async () => {
  const resolved = await resolveTemplateAssetFile(
    "templates_docs/sanitized/attestation-residence.docx",
  );
  assert.equal(path.basename(resolved), "attestation-residence.docx");
  assert.equal(path.basename(path.dirname(resolved)), "sanitized");
  await assert.rejects(
    resolveTemplateAssetFile("templates_docs/attestation-residence.docx"),
  );
});

test("writes and resolves uploaded assets below the persistent storage root", async (t) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cyberdoc-assets-"));
  const previousStorageRoot = process.env.DOCS_STORAGE_DIR;
  process.env.DOCS_STORAGE_DIR = temporaryRoot;
  t.after(async () => {
    if (previousStorageRoot === undefined) delete process.env.DOCS_STORAGE_DIR;
    else process.env.DOCS_STORAGE_DIR = previousStorageRoot;
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  });

  const storedPath = buildUploadedTemplateAssetPath("draft.docx");
  const writePath = await writeUploadedTemplateAsset(
    storedPath,
    Buffer.from("docx fixture"),
  );

  assert.equal(await resolveTemplateAssetFile(storedPath), writePath);
  assert.equal((await readTemplateAssetFile(storedPath)).toString(), "docx fixture");
  await deleteUploadedTemplateAsset(storedPath);
  await assert.rejects(resolveTemplateAssetFile(storedPath));
});
