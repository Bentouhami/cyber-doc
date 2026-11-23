import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { describe, it } from "node:test";

function runSmoke(baseURL: string) {
  return new Promise<{ code: number; output: string }>((resolve) => {
    const child = spawn(process.execPath, ["scripts/post-deploy-smoke-runner.mjs"], {
      env: {
        ...process.env,
        SMOKE_BASE_URL: baseURL,
        SMOKE_ADMIN_EMAIL: "release-smoke@example.test",
        SMOKE_ADMIN_PASSWORD: "not-a-real-password",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk.toString()));
    child.stderr.on("data", (chunk) => (output += chunk.toString()));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

describe("remote post-deploy smoke", () => {
  it("rejects non-loopback HTTP before sending credentials", async () => {
    const result = await runSmoke("http://cyberdoc.example");

    assert.equal(result.code, 1);
    assert.match(result.output, /must use HTTPS/);
    assert.doesNotMatch(result.output, /not-a-real-password/);
  });

  it("uses only read operations between login and logout", async () => {
    const requests: Array<{ method: string; url: string }> = [];
    const server = createServer((request, response) => {
      const method = request.method ?? "";
      const url = request.url ?? "";
      requests.push({ method, url });

      response.setHeader("content-type", "application/json");
      if (url === "/api/health") return response.end('{"status":"ok"}');
      if (url === "/api/auth/sign-in/email" && method === "POST") {
        response.setHeader("set-cookie", "session=test; Path=/; HttpOnly");
        return response.end("{}");
      }
      if (!request.headers.cookie?.includes("session=test")) {
        response.statusCode = 401;
        return response.end("{}");
      }
      if (url === "/api/users/me") {
        return response.end('{"roles":[{"name":"owner"}]}');
      }
      if (url === "/api/auth/sign-out" && method === "POST") return response.end("{}");
      if (method === "GET") return response.end("{}");
      response.statusCode = 405;
      return response.end("{}");
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    try {
      const result = await runSmoke(`http://127.0.0.1:${address.port}`);
      assert.equal(result.code, 0, result.output);
      assert.match(result.output, /7 read-only checks passed/);
      assert.deepEqual(
        requests.filter(({ method }) => !["GET", "POST"].includes(method)),
        [],
      );
      assert.deepEqual(
        requests.filter(({ method }) => method === "POST").map(({ url }) => url),
        ["/api/auth/sign-in/email", "/api/auth/sign-out"],
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
