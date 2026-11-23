import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("activity log privacy", () => {
  it("does not persist session user-agent metadata for login events", async () => {
    const authSource = await readFile("lib/auth.ts", "utf8");
    const loginActivityWrite = authSource.match(
      /prisma\.activityLog\.create\(\{([\s\S]*?)\n\s*\}\);/,
    )?.[1];

    assert.ok(loginActivityWrite, "Expected the login activity writer");
    assert.doesNotMatch(loginActivityWrite, /userAgent/);
  });
});
