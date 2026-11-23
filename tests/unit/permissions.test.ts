import assert from "node:assert/strict";
import test from "node:test";

import { hasAnyRole } from "../../lib/permissions";

test("document access accepts employee and admin roles", () => {
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "employee" } }] }, ["employee", "admin"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "admin" } }] }, ["employee", "admin"]),
    true,
  );
});

test("document access rejects roleless and unknown-role users", () => {
  assert.equal(hasAnyRole({ roles: [] }, ["employee", "admin"]), false);
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "viewer" } }] }, ["employee", "admin"]),
    false,
  );
});
