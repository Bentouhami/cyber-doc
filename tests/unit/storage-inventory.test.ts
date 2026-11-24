import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyDocumentStoragePath,
  classifyTemplateAssetPath,
  countStorageBuckets,
} from "../../lib/storage-inventory";

test("storage inventory classifies only path families and counts them", () => {
  assert.deepEqual(
    countStorageBuckets(
      [null, "documents/a.pdf", "storage/documents/b.pdf", "unexpected/c.pdf"],
      classifyDocumentStoragePath,
    ),
    { missing: 1, documents: 1, "legacy-storage-documents": 1, other: 1 },
  );
  assert.equal(
    classifyTemplateAssetPath("templates_docs/sanitized/template.docx"),
    "packaged-sanitized-assets",
  );
});
