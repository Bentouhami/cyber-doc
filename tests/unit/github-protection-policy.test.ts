import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_CHECKS,
  evaluateProtection,
} from "../../scripts/release/github-protection-policy.mjs";

function protection(contexts = REQUIRED_CHECKS) {
  return {
    required_status_checks: { contexts },
  };
}

test("accepts the complete branch protection policy", () => {
  assert.deepEqual(evaluateProtection(protection()), {
    needsContextChange: false,
    needsChange: false,
  });
});

test("requires the exact current check set", () => {
  assert.deepEqual(evaluateProtection(protection(REQUIRED_CHECKS.slice(1))), {
    needsContextChange: true,
    needsChange: true,
  });
});
