import fs from "node:fs/promises";
import path from "node:path";
import { request } from "playwright";

const outDir = path.join(process.cwd(), "tmp", "post-deploy-smoke");

function resolveTargetOrigin(value) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("SMOKE_BASE_URL must be an exact HTTP(S) origin");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!loopback && url.protocol !== "https:") {
    throw new Error("A non-loopback post-deploy target must use HTTPS");
  }
  return url.origin;
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for post-deploy smoke`);
  return value;
}

async function run() {
  const baseURL = resolveTargetOrigin(requiredEnvironment("SMOKE_BASE_URL"));
  const email = requiredEnvironment("SMOKE_ADMIN_EMAIL");
  const password = requiredEnvironment("SMOKE_ADMIN_PASSWORD");
  const results = [];
  const api = await request.newContext({
    baseURL,
    extraHTTPHeaders: { "user-agent": "CyberDoc-release-smoke/1.0" },
  });
  let authenticated = false;

  async function expectOk(name, route) {
    const response = await api.get(route, { maxRedirects: 0 });
    results.push({ name, method: "GET", route, status: response.status() });
    if (!response.ok()) throw new Error(`${name} returned HTTP ${response.status()}`);
    return response;
  }

  try {
    const health = await expectOk("readiness", "/api/health");
    const healthBody = await health.json().catch(() => null);
    if (healthBody?.status !== "ok") throw new Error("Readiness status is not ok");

    const login = await api.post("/api/auth/sign-in/email", {
      data: { email, password, rememberMe: false },
      maxRedirects: 0,
    });
    results.push({
      name: "login",
      method: "POST",
      route: "/api/auth/sign-in/email",
      status: login.status(),
    });
    if (!login.ok()) throw new Error(`Login returned HTTP ${login.status()}`);
    authenticated = true;

    const profile = await expectOk("profile", "/api/users/me");
    const profileBody = await profile.json().catch(() => null);
    const isAdmin =
      Array.isArray(profileBody?.roles) &&
      profileBody.roles.some((role) => ["owner", "responsible"].includes(role?.name));
    if (!isAdmin) throw new Error("Smoke account is not an owner or responsible user");

    await expectOk("documents", "/api/documents?page=1&pageSize=1");
    await expectOk("templates", "/api/templates?page=1&pageSize=1");
    await expectOk("activity", "/api/activity-logs?page=1&pageSize=1");
  } finally {
    if (authenticated) {
      const logout = await api.post("/api/auth/sign-out", {
        headers: { origin: baseURL },
        maxRedirects: 0,
      });
      results.push({
        name: "logout",
        method: "POST",
        route: "/api/auth/sign-out",
        status: logout.status(),
      });
      if (!logout.ok()) process.exitCode = 1;
    }
    await api.dispose();
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(
      path.join(outDir, "results.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, results }, null, 2),
      "utf8",
    );
  }

  if (!process.exitCode) {
    console.log(`post-deploy-smoke: ${results.length} read-only checks passed`);
  }
}

run().catch((error) => {
  console.error(
    "post-deploy-smoke failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
