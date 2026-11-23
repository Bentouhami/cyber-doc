import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertDisposableSmokeDatabase } from "../../scripts/smoke-database-policy.mjs";

describe("critical smoke database policy", () => {
  it("requires an explicit disposable-database acknowledgement", () => {
    assert.throws(
      () =>
        assertDisposableSmokeDatabase({
          databaseUrl: "postgresql://user:secret@127.0.0.1:5432/cyber_doc_ci",
        }),
      /SMOKE_DISPOSABLE_DATABASE=1/,
    );
  });

  it("accepts an acknowledged local CI database", () => {
    assert.doesNotThrow(() =>
      assertDisposableSmokeDatabase({
        databaseUrl: "postgresql://user:secret@127.0.0.1:5432/cyber_doc_ci",
        disposableAcknowledgement: "1",
      }),
    );
  });

  it("rejects a local database without a disposable name", () => {
    assert.throws(
      () =>
        assertDisposableSmokeDatabase({
          databaseUrl: "postgresql://user:secret@127.0.0.1:5432/cyber_doc",
          disposableAcknowledgement: "1",
        }),
      /name must identify a disposable target/,
    );
  });

  it("accepts an acknowledged remote recovery branch", () => {
    assert.doesNotThrow(() =>
      assertDisposableSmokeDatabase({
        databaseUrl: "postgresql://user:secret@example.neon.tech/neondb",
        disposableAcknowledgement: "1",
        branchName: "recovery-drill-20261123",
      }),
    );
  });

  it("rejects production branch names even when acknowledged", () => {
    assert.throws(
      () =>
        assertDisposableSmokeDatabase({
          databaseUrl: "postgresql://user:secret@example.neon.tech/neondb",
          disposableAcknowledgement: "1",
          branchName: "production",
        }),
      /remote smoke database branch must identify a disposable target/i,
    );
  });
});
