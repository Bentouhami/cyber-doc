import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production auth rate limits use the shared database", async () => {
  const source = await readFile("lib/auth.ts", "utf8");
  const compose = await readFile("compose.yaml", "utf8");

  assert.match(
    source,
    /rateLimit:\s*\{\s*storage:\s*"database",?\s*\}/,
  );
  assert.match(source, /ipAddressHeaders:\s*authNetworkConfig\.ipAddressHeaders/);
  assert.match(compose, /BETTER_AUTH_TRUSTED_PROXIES:/);
  assert.match(compose, /BETTER_AUTH_TRUSTED_ORIGINS:/);
});
