import assert from "node:assert/strict";
import test from "node:test";

import { resolvePdfRuntime } from "../../lib/pdf-runtime";

test("PDF runtime prefers an explicit browser and otherwise selects Vercel safely", () => {
  assert.deepEqual(
    resolvePdfRuntime({
      VERCEL: "1",
      PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: "/usr/bin/chromium",
    }),
    { mode: "custom", executablePath: "/usr/bin/chromium" },
  );
  assert.deepEqual(resolvePdfRuntime({ VERCEL: "1" }), { mode: "vercel" });
  assert.deepEqual(resolvePdfRuntime({}), { mode: "local" });
});
