import assert from "node:assert/strict";
import test from "node:test";

import {
  canAssignManagedRoles,
  canDeleteManagedUser,
  canUpdateManagedUser,
  hasManagementRole,
} from "../../lib/management-role-policy";

test("owner and responsible can manage the back office", () => {
  assert.equal(hasManagementRole(["owner"]), true);
  assert.equal(hasManagementRole(["responsible"]), true);
  assert.equal(hasManagementRole(["employee"]), false);
});

test("only the owner can designate a responsible", () => {
  assert.equal(canAssignManagedRoles(["owner"], ["responsible"]), true);
  assert.equal(canAssignManagedRoles(["responsible"], ["responsible"]), false);
  assert.equal(canAssignManagedRoles(["responsible"], ["employee"]), true);
  assert.equal(canAssignManagedRoles(["owner"], ["owner"]), false);
});

test("a responsible cannot edit or delete the owner", () => {
  assert.equal(
    canUpdateManagedUser({
      actorId: "responsible-id",
      actorRoleNames: ["responsible"],
      targetId: "owner-id",
      targetRoleNames: ["owner"],
    }),
    false,
  );
  assert.equal(canDeleteManagedUser(["responsible"], ["owner"]), false);
});

test("owner role is immutable while the owner may update their own profile", () => {
  assert.equal(
    canUpdateManagedUser({
      actorId: "owner-id",
      actorRoleNames: ["owner"],
      targetId: "owner-id",
      targetRoleNames: ["owner"],
    }),
    true,
  );
  assert.equal(
    canUpdateManagedUser({
      actorId: "owner-id",
      actorRoleNames: ["owner"],
      targetId: "owner-id",
      targetRoleNames: ["owner"],
      assignedRoleNames: ["employee"],
    }),
    false,
  );
  assert.equal(canDeleteManagedUser(["owner"], ["owner"]), false);
});

test("responsible CRUD is limited to employees", () => {
  assert.equal(
    canUpdateManagedUser({
      actorId: "responsible-id",
      actorRoleNames: ["responsible"],
      targetId: "employee-id",
      targetRoleNames: ["employee"],
    }),
    true,
  );
  assert.equal(canDeleteManagedUser(["responsible"], ["employee"]), true);
  assert.equal(canDeleteManagedUser(["responsible"], ["responsible"]), false);
});
