import assert from "node:assert/strict";
import test from "node:test";

import { areReadinessDependenciesAvailable } from "../../lib/readiness-policy";

test("readiness requires every dependency", async () => {
  assert.equal(
    await areReadinessDependenciesAvailable([
      async () => true,
      async () => undefined,
    ]),
    true,
  );
  assert.equal(
    await areReadinessDependenciesAvailable([
      async () => true,
      async () => {
        throw new Error("unavailable");
      },
    ]),
    false,
  );
});
