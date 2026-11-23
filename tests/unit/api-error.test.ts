import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyApiError,
  createSafeApiErrorEvent,
} from "../../lib/api-error";

describe("safe API errors", () => {
  it("classifies known failures without retaining their message", () => {
    const error = Object.assign(new Error("credential=secret path=C:\\private\\record"), {
      code: "ENOENT",
    });
    const event = createSafeApiErrorEvent(
      { route: "/api/example", operation: "read_record" },
      error,
    );
    const serialized = JSON.stringify(event);

    assert.equal(classifyApiError(error), "filesystem");
    assert.deepEqual(event, {
      level: "error",
      event: "api_error",
      route: "/api/example",
      operation: "read_record",
      errorType: "filesystem",
    });
    assert.doesNotMatch(serialized, /secret|private|credential/i);
  });

  it("does not expose unknown object properties", () => {
    const event = createSafeApiErrorEvent(
      { route: "/api/example", operation: "mutate_record" },
      { message: "sensitive record", token: "not-for-logs" },
    );

    assert.equal(event.errorType, "runtime");
    assert.doesNotMatch(JSON.stringify(event), /sensitive|token|not-for-logs/i);
  });
});
