import assert from "node:assert/strict";
import test from "node:test";

import { isCurrentProfileRequest } from "../../lib/profile-request-policy";

test("accepts a profile result only for the current subject and generation", () => {
  assert.equal(
    isCurrentProfileRequest(
      { subjectEmail: "current@example.test", generation: 2 },
      "current@example.test",
      2,
    ),
    true,
  );
});

test("rejects a result from a previous session subject", () => {
  assert.equal(
    isCurrentProfileRequest(
      { subjectEmail: "previous@example.test", generation: 2 },
      "current@example.test",
      2,
    ),
    false,
  );
});

test("rejects a result superseded by a newer request generation", () => {
  assert.equal(
    isCurrentProfileRequest(
      { subjectEmail: "current@example.test", generation: 1 },
      "current@example.test",
      2,
    ),
    false,
  );
});

test("rejects an aborted request result", () => {
  assert.equal(
    isCurrentProfileRequest(
      { subjectEmail: "current@example.test", generation: 2 },
      "current@example.test",
      2,
      true,
    ),
    false,
  );
});
