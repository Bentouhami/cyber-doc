import assert from "node:assert/strict";
import test from "node:test";

import { hasAnyRole } from "../../lib/permissions";

test("document access accepts employee, owner and responsible roles", () => {
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "employee" } }] }, ["employee", "owner", "responsible"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "owner" } }] }, ["employee", "owner", "responsible"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "responsible" } }] }, ["employee", "owner", "responsible"]),
    true,
  );
});

test("legacy admin permissions include the owner and responsible replacements", () => {
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "employee" } }] }, ["employee", "admin"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "admin" } }] }, ["employee", "admin"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "owner" } }] }, ["employee", "admin"]),
    true,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "responsible" } }] }, ["employee", "admin"]),
    true,
  );
});

test("document access rejects roleless and unknown-role users", () => {
  assert.equal(hasAnyRole({ roles: [] }, ["employee", "admin"]), false);
  assert.equal(hasAnyRole({ roles: [] }, ["employee", "owner", "responsible"]), false);
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "viewer" } }] }, ["employee", "admin"]),
    false,
  );
  assert.equal(
    hasAnyRole({ roles: [{ role: { name: "viewer" } }] }, ["employee", "owner", "responsible"]),
    false,
  );
});
