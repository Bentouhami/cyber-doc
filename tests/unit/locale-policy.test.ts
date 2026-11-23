import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveUiLocale } from "../../lib/locale-policy";

describe("UI locale policy", () => {
  it("defaults missing or unsupported preferences to Arabic", () => {
    assert.equal(resolveUiLocale(undefined), "ar");
    assert.equal(resolveUiLocale("de"), "ar");
  });

  it("preserves explicit French and Arabic preferences", () => {
    assert.equal(resolveUiLocale("fr"), "fr");
    assert.equal(resolveUiLocale("ar"), "ar");
  });
});
