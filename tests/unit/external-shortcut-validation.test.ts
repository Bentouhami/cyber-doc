import assert from "node:assert/strict";
import test from "node:test";

import {
  externalShortcutCreateSchema,
  externalShortcutUpdateSchema,
} from "../../lib/external-shortcut-validation";

test("accepts bounded HTTP(S) shortcuts and normalizes labels", () => {
  const result = externalShortcutCreateSchema.parse({
    title: "  Portail fiscal ",
    titleAr: " البوابة الضريبية ",
    url: "https://example.test/path",
  });
  assert.equal(result.title, "Portail fiscal");
  assert.equal(result.displayOrder, 0);
  assert.equal(result.isActive, true);
});

test("rejects executable, credential-bearing and empty shortcut updates", () => {
  for (const url of ["javascript:alert(1)", "https://user:secret@example.test", "not-a-url"]) {
    assert.equal(
      externalShortcutCreateSchema.safeParse({ title: "X", titleAr: "س", url }).success,
      false,
    );
  }
  assert.equal(externalShortcutUpdateSchema.safeParse({}).success, false);
});
