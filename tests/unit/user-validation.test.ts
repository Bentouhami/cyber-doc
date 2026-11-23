import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createUserSchema,
  PASSWORD_POLICY,
  updateUserSchema,
} from "../../lib/user-validation";

const validCreatePayload = {
  email: " Employee@Example.COM ",
  password: "Aa123456",
  firstName: "  Alice ",
  lastName: " Example  ",
  roleNames: ["employee", "employee"],
};

describe("user API validation", () => {
  it("normalizes identity fields and de-duplicates roles", () => {
    const parsed = createUserSchema.parse(validCreatePayload);

    assert.equal(parsed.email, "employee@example.com");
    assert.equal(parsed.firstName, "Alice");
    assert.equal(parsed.lastName, "Example");
    assert.deepEqual(parsed.roleNames, ["employee"]);
  });

  it("enforces the shared password length and composition policy", () => {
    const invalidPasswords = [
      "short1A",
      "alllowercase1",
      "ALLUPPERCASE1",
      "NoNumberHere",
      `Aa1${"x".repeat(PASSWORD_POLICY.maxLength)}`,
    ];

    for (const password of invalidPasswords) {
      assert.equal(
        createUserSchema.safeParse({ ...validCreatePayload, password }).success,
        false,
      );
    }
  });

  it("rejects malformed emails, control characters, invalid roles and unknown fields", () => {
    const payloads = [
      { ...validCreatePayload, email: "not-an-email" },
      { ...validCreatePayload, firstName: "Alice\r\nAdmin" },
      { ...validCreatePayload, roleNames: ["Admin Role"] },
      { ...validCreatePayload, unexpected: true },
    ];

    for (const payload of payloads) {
      assert.equal(createUserSchema.safeParse(payload).success, false);
    }
  });

  it("treats an empty update password as omitted but rejects weak replacements", () => {
    const parsed = updateUserSchema.parse({ password: "", firstName: "Alice" });
    assert.equal(parsed.password, undefined);
    assert.equal(parsed.firstName, "Alice");
    assert.equal(updateUserSchema.safeParse({ password: "weak" }).success, false);
  });

  it("rejects empty or type-confused updates", () => {
    assert.equal(updateUserSchema.safeParse({}).success, false);
    assert.equal(updateUserSchema.safeParse({ isActive: "false" }).success, false);
    assert.equal(updateUserSchema.safeParse({ roleNames: "employee" }).success, false);
  });
});
