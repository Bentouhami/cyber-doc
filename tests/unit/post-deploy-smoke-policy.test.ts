import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const script = "scripts/release/post-deploy-smoke.ps1";

function validateBaseUrl(baseUrl: string) {
  return spawnSync(
    "pwsh",
    ["-NoProfile", "-File", script, "-BaseUrl", baseUrl, "-ValidateOnly"],
    { encoding: "utf8" },
  );
}

describe("post-deploy smoke target policy", () => {
  it("accepts an HTTPS origin and local HTTP development targets", () => {
    const production = validateBaseUrl("https://cyberdoc.example");
    const local = validateBaseUrl("http://127.0.0.1:3000/");

    assert.equal(production.status, 0, production.stderr);
    assert.equal(production.stdout.trim(), "https://cyberdoc.example");
    assert.equal(local.status, 0, local.stderr);
    assert.equal(local.stdout.trim(), "http://127.0.0.1:3000");
  });

  it("rejects targets that could expose smoke credentials", () => {
    for (const target of [
      "http://cyberdoc.example",
      "https://user:password@cyberdoc.example",
      "https://cyberdoc.example/path",
      "https://cyberdoc.example?target=other",
      "https://cyberdoc.example#fragment",
      "file:///tmp/cyberdoc",
    ]) {
      const result = validateBaseUrl(target);
      assert.notEqual(result.status, 0, `${target} should be rejected`);
    }
  });
});
