import assert from "node:assert/strict";
import test from "node:test";
import PizZip from "pizzip";

import {
  DocxUploadError,
  MAX_DOCX_MULTIPART_BYTES,
  multipartBodyExceedsDocxLimit,
  readBoundedMultipartFormData,
  validateDocxBuffer,
} from "../../services/docxUploadSecurity";

function docxBuffer(options: { macro?: boolean; document?: boolean } = {}) {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", "<Types />");
  if (options.document !== false) {
    zip.file("word/document.xml", "<w:document />");
  }
  if (options.macro) zip.file("word/vbaProject.bin", "macro");
  return zip.generate({ type: "nodebuffer" }) as Buffer;
}

test("accepts a bounded macro-free DOCX package", () => {
  assert.doesNotThrow(() => validateDocxBuffer(docxBuffer()));
});

test("rejects renamed, corrupt, incomplete and macro-enabled uploads", () => {
  for (const value of [
    Buffer.from("not a zip"),
    docxBuffer({ document: false }),
    docxBuffer({ macro: true }),
  ]) {
    assert.throws(
      () => validateDocxBuffer(value),
      (error: unknown) =>
        error instanceof DocxUploadError && error.code === "INVALID_DOCX",
    );
  }
});

test("rejects an oversized multipart request before body buffering", () => {
  assert.equal(
    multipartBodyExceedsDocxLimit(String(MAX_DOCX_MULTIPART_BYTES + 1)),
    true,
  );
  assert.equal(multipartBodyExceedsDocxLimit(String(MAX_DOCX_MULTIPART_BYTES)), false);
  assert.equal(multipartBodyExceedsDocxLimit(null), false);
});

test("rejects a chunked multipart body as soon as the streamed limit is exceeded", async () => {
  const request = new Request("http://localhost/upload", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test" },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5, 6]));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(
    () => readBoundedMultipartFormData(request, 5),
    (error: unknown) =>
      error instanceof DocxUploadError && error.code === "TOO_LARGE",
  );
});
