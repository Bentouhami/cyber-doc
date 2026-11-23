import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_DATABASE_INTEGER,
  parseDateOnlyQueryParam,
  parseIntegerQueryParam,
} from "../../lib/query-params";

const options = { defaultValue: 20, min: 1, max: 100 };

describe("parseIntegerQueryParam", () => {
  it("returns the configured default when the parameter is absent", () => {
    assert.deepEqual(
      parseIntegerQueryParam(new URLSearchParams(), "pageSize", options),
      { success: true, value: 20 },
    );
  });

  it("accepts inclusive integer boundaries", () => {
    assert.deepEqual(
      parseIntegerQueryParam(new URLSearchParams("pageSize=1"), "pageSize", options),
      { success: true, value: 1 },
    );
    assert.deepEqual(
      parseIntegerQueryParam(new URLSearchParams("pageSize=100"), "pageSize", options),
      { success: true, value: 100 },
    );
  });

  for (const invalidValue of ["", "abc", "NaN", "Infinity", "1.5", "0", "101"]) {
    it(`rejects invalid value ${JSON.stringify(invalidValue)}`, () => {
      const result = parseIntegerQueryParam(
        new URLSearchParams({ pageSize: invalidValue }),
        "pageSize",
        options,
      );

      assert.equal(result.success, false);
      if (!result.success) {
        assert.deepEqual(result.error, {
          message: "Invalid query parameter",
          issues: [
            {
              parameter: "pageSize",
              expected: "integer between 1 and 100",
            },
          ],
        });
      }
    });
  }

  it("rejects integers outside the JavaScript safe range", () => {
    const result = parseIntegerQueryParam(
      new URLSearchParams({ pageSize: String(Number.MAX_SAFE_INTEGER + 1) }),
      "pageSize",
      { defaultValue: 1, min: 1, max: Number.MAX_VALUE },
    );

    assert.equal(result.success, false);
  });

  it("can enforce the PostgreSQL integer boundary", () => {
    const result = parseIntegerQueryParam(
      new URLSearchParams({ statusId: String(MAX_DATABASE_INTEGER + 1) }),
      "statusId",
      { defaultValue: 0, min: 1, max: MAX_DATABASE_INTEGER },
    );

    assert.equal(result.success, false);
  });
});

describe("parseDateOnlyQueryParam", () => {
  it("accepts a real calendar date and can return the exclusive next day", () => {
    const params = new URLSearchParams("to=2024-02-29");

    assert.deepEqual(parseDateOnlyQueryParam(params, "to", { nextDay: true }), {
      success: true,
      value: new Date("2024-03-01T00:00:00.000Z"),
    });
  });

  it("returns null when the parameter is absent", () => {
    assert.deepEqual(parseDateOnlyQueryParam(new URLSearchParams(), "from"), {
      success: true,
      value: null,
    });
  });

  for (const invalidValue of ["", "2026-2-03", "2026-02-30", "not-a-date"]) {
    it(`rejects invalid value ${JSON.stringify(invalidValue)}`, () => {
      const result = parseDateOnlyQueryParam(
        new URLSearchParams({ from: invalidValue }),
        "from",
      );

      assert.equal(result.success, false);
    });
  }
});
