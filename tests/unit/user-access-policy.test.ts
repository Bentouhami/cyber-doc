import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isUserActive } from "../../lib/user-access-policy";

const timestamp = new Date("2026-01-01T00:00:00.000Z");

describe("isUserActive", () => {
  it("allows an activated user with no deactivation or deletion", () => {
    assert.equal(
      isUserActive({ activatedAt: timestamp, deactivatedAt: null, deletedAt: null }),
      true,
    );
  });

  it("rejects a user who has never been activated", () => {
    assert.equal(
      isUserActive({ activatedAt: null, deactivatedAt: null, deletedAt: null }),
      false,
    );
  });

  it("rejects a deactivated user even when previously activated", () => {
    assert.equal(
      isUserActive({ activatedAt: timestamp, deactivatedAt: timestamp, deletedAt: null }),
      false,
    );
  });

  it("rejects a deleted user even when activated", () => {
    assert.equal(
      isUserActive({ activatedAt: timestamp, deactivatedAt: null, deletedAt: timestamp }),
      false,
    );
  });

  it("rejects a user who is both deactivated and deleted", () => {
    assert.equal(
      isUserActive({
        activatedAt: timestamp,
        deactivatedAt: timestamp,
        deletedAt: timestamp,
      }),
      false,
    );
  });
});
