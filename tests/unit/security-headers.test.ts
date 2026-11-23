import assert from "node:assert/strict";
import test from "node:test";

import { buildApplicationContentSecurityPolicy } from "../../lib/security-headers";

test("production CSP rejects development and wildcard network allowances", async () => {
  const csp = buildApplicationContentSecurityPolicy("productionNonce", false);

  assert.doesNotMatch(csp, /'unsafe-eval'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(csp, /script-src[^;]*https:/);
  assert.doesNotMatch(csp, /connect-src[^;]*(?:https:|ws:|wss:)/);
  assert.match(csp, /script-src[^;]*'nonce-productionNonce'/);
  assert.match(csp, /script-src[^;]*'strict-dynamic'/);
  assert.match(csp, /upgrade-insecure-requests/);
});

test("development CSP retains the allowances required by Next hot reload", async () => {
  const csp = buildApplicationContentSecurityPolicy("developmentNonce", true);

  assert.match(csp, /script-src[^;]*'unsafe-eval'/);
  assert.match(csp, /connect-src[^;]*ws:/);
  assert.doesNotMatch(csp, /upgrade-insecure-requests/);
});
