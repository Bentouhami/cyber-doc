import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("signed-out headers link to the existing login screen", async () => {
  const sources = await Promise.all([
    readFile("components/layout/admin-header.tsx", "utf8"),
    readFile("components/layout/employee-header.tsx", "utf8"),
  ]);

  for (const source of sources) {
    assert.match(source, /<Link href="\/">\{t\("user\.menu\.profile"\)\}<\/Link>/);
    assert.doesNotMatch(source, /\/auth\/login/);
  }
});
