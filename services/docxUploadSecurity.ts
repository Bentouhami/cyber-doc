import PizZip from "pizzip";

export const MAX_DOCX_BYTES = 10 * 1024 * 1024;
export const MAX_DOCX_MULTIPART_BYTES = MAX_DOCX_BYTES + 512 * 1024;
const MAX_DOCX_ENTRIES = 5_000;
const MAX_DOCX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_DOCX_ENTRY_BYTES = 24 * 1024 * 1024;

export class DocxUploadError extends Error {
  constructor(readonly code: "TOO_LARGE" | "INVALID_DOCX") {
    super(code === "TOO_LARGE" ? "DOCX file is too large" : "Invalid DOCX file");
    this.name = "DocxUploadError";
  }
}

export function multipartBodyExceedsDocxLimit(contentLength: string | null) {
  if (!contentLength || !/^\d+$/.test(contentLength)) return false;
  const length = Number(contentLength);
  return !Number.isSafeInteger(length) || length > MAX_DOCX_MULTIPART_BYTES;
}

export async function readBoundedMultipartFormData(
  request: Request,
  maxBytes = MAX_DOCX_MULTIPART_BYTES,
) {
  if (!request.body) {
    throw new DocxUploadError("INVALID_DOCX");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("multipart body exceeds configured limit");
        throw new DocxUploadError("TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new DocxUploadError("INVALID_DOCX");
  }

  return new Response(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), {
    headers: { "content-type": contentType },
  }).formData();
}

export function validateDocxBuffer(buffer: Buffer) {
  if (buffer.length === 0 || buffer.length > MAX_DOCX_BYTES) {
    throw new DocxUploadError("TOO_LARGE");
  }
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x50 ||
    buffer[1] !== 0x4b ||
    buffer[2] !== 0x03 ||
    buffer[3] !== 0x04
  ) {
    throw new DocxUploadError("INVALID_DOCX");
  }

  let zip: PizZip;
  try {
    zip = new PizZip(buffer);
  } catch {
    throw new DocxUploadError("INVALID_DOCX");
  }

  const entries = Object.values(zip.files) as Array<{
    dir?: boolean;
    _data?: { uncompressedSize?: number };
  }>;
  if (entries.length > MAX_DOCX_ENTRIES) {
    throw new DocxUploadError("INVALID_DOCX");
  }

  let totalUncompressedBytes = 0;
  for (const entry of entries) {
    if (entry.dir) continue;
    const size = entry._data?.uncompressedSize;
    if (!Number.isSafeInteger(size) || (size ?? 0) < 0 || (size ?? 0) > MAX_DOCX_ENTRY_BYTES) {
      throw new DocxUploadError("INVALID_DOCX");
    }
    totalUncompressedBytes += size ?? 0;
    if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new DocxUploadError("INVALID_DOCX");
    }
  }

  if (
    !zip.file("[Content_Types].xml") ||
    !zip.file("word/document.xml") ||
    zip.file("word/vbaProject.bin")
  ) {
    throw new DocxUploadError("INVALID_DOCX");
  }
}
