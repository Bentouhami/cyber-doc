import assert from "node:assert/strict";
import test from "node:test";

import { safeInternalRedirect } from "../../lib/safe-redirect";

test("accepts and normalizes internal application paths", () => {
  assert.equal(
    safeInternalRedirect("/documents/example?tab=history#current"),
    "/documents/example?tab=history#current",
  );
});

test("rejects external, protocol-relative and malformed redirect targets", () => {
  for (const value of [
    "https://example.com",
    "//example.com/path",
    "\\\\example.com\\path",
    "javascript:alert(1)",
    "/documents\nhttps://example.com",
    undefined,
  ]) {
    assert.equal(safeInternalRedirect(value), "/documents");
  }
});

test("uses the caller fallback for rejected auth response URLs", () => {
  assert.equal(safeInternalRedirect("https://example.com", "/admin"), "/admin");
});
