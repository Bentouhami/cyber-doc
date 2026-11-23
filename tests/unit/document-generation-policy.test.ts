import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  validateParticipantSubmission,
  type ParticipantRoleRule,
} from "../../lib/document-generation-policy";

const roles: ParticipantRoleRule[] = [
  { roleKey: "seller", isRequired: true, minParticipants: 1, maxParticipants: 1 },
  { roleKey: "witness", isRequired: false, minParticipants: 1, maxParticipants: 2 },
];

describe("document generation participant policy", () => {
  it("rejects missing required and unknown participant roles", () => {
    assert.deepEqual(validateParticipantSubmission(roles, []), [
      { code: "PARTICIPANT_MIN_NOT_MET", roleKey: "seller", expected: 1, actual: 0 },
    ]);
    const unknown = validateParticipantSubmission(roles, [
      { roleKey: "seller", personaId: "p1" },
      { roleKey: "administrator", personaId: "p2" },
    ]);
    assert.equal(unknown[0]?.code, "PARTICIPANT_ROLE_UNKNOWN");
  });

  it("enforces maximum role cardinality while ignoring empty optional roles", () => {
    assert.deepEqual(validateParticipantSubmission(roles, [
      { roleKey: "seller", persona: { fullName: "Alice" } },
      { roleKey: "witness", persona: {} },
    ]), []);
    const exceeded = validateParticipantSubmission(roles, [
      { roleKey: "seller", personaId: "p1" },
      { roleKey: "seller", personaId: "p2" },
    ]);
    assert.equal(exceeded[0]?.code, "PARTICIPANT_MAX_EXCEEDED");
  });

  it("rejects duplicate role/person combinations", () => {
    const duplicates = validateParticipantSubmission(
      [{ ...roles[0]!, maxParticipants: 3 }],
      [
        { roleKey: "seller", persona: { nationalId: " ab-123 " } },
        { roleKey: "seller", persona: { nationalId: "AB-123" } },
      ],
    );
    assert.equal(duplicates[0]?.code, "PARTICIPANT_DUPLICATE");

    const duplicateWithoutNationalId = validateParticipantSubmission(
      [{ ...roles[0]!, maxParticipants: 3 }],
      [
        { roleKey: "seller", persona: { fullName: "Alice", phone: "0612345678" } },
        { roleKey: "seller", persona: { fullName: " alice ", phone: "0612345678" } },
      ],
    );
    assert.equal(duplicateWithoutNationalId[0]?.code, "PARTICIPANT_DUPLICATE");

    const mixedExistingAndInline = validateParticipantSubmission(
      [{ ...roles[0]!, maxParticipants: 3 }],
      [
        {
          roleKey: "seller",
          personaId: "stored-persona",
          persona: { fullName: "Alice", phone: "0612345678" },
        },
        { roleKey: "seller", persona: { fullName: "alice", phone: "0612345678" } },
      ],
    );
    assert.equal(mixedExistingAndInline[0]?.code, "PARTICIPANT_DUPLICATE");
  });

  it("rejects inconsistent template cardinality", () => {
    const invalid = validateParticipantSubmission(
      [{ roleKey: "seller", isRequired: true, minParticipants: 2, maxParticipants: 1 }],
      [{ roleKey: "seller", personaId: "p1" }],
    );
    assert.equal(invalid[0]?.code, "PARTICIPANT_ROLE_CONFIG_INVALID");
  });
});
