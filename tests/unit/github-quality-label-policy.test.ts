import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_LABEL,
  evaluateQualityLabel,
  resolvePullRequestNumber,
} from "../../scripts/release/github-quality-label-policy.mjs";

test("resolves the only open pull request for the current branch", () => {
  assert.equal(resolvePullRequestNumber([{ number: 42 }], "release/v1"), 42);
});

test("rejects a branch without exactly one open pull request", () => {
  assert.throws(() => resolvePullRequestNumber([], "release/v1"), /No open pull request/);
  assert.throws(
    () => resolvePullRequestNumber([{ number: 1 }, { number: 2 }], "release/v1"),
    /Multiple open pull requests/,
  );
});

test("rejects a merged pull request even when the quality label is present", () => {
  assert.deepEqual(
    evaluateQualityLabel(true, {
      number: 12,
      state: "MERGED",
      labels: [{ name: REQUIRED_LABEL }],
    }),
    ["PR #12 is MERGED, not OPEN"],
  );
});

test("accepts only an open pull request with the repository label applied", () => {
  assert.deepEqual(
    evaluateQualityLabel(true, {
      number: 42,
      state: "OPEN",
      labels: [{ name: REQUIRED_LABEL }],
    }),
    [],
  );
});
