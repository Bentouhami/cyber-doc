import fs from "node:fs/promises";
import path from "node:path";
import { request as playwrightRequest } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";
const employeeEmail = process.env.SMOKE_EMPLOYEE_EMAIL ?? "employee@cybercafe.com";
const employeePassword = process.env.SMOKE_EMPLOYEE_PASSWORD ?? "12345678";
const outDir = path.join(process.cwd(), "tmp", "permissions-smoke");

const results = [];

function pushResult(name, ok, details = "") {
  results.push({ name, ok, details });
}

async function requestJson(api, method, routePath, data) {
  const response = await api.fetch(routePath, {
    method,
    headers: data !== undefined ? { "content-type": "application/json" } : undefined,
    data,
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function login(api, email, password, label) {
  const endpoints = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-in/credential",
    "/api/auth/sign-in",
  ];

  for (const endpoint of endpoints) {
    try {
      const { response } = await requestJson(api, "POST", endpoint, {
        email,
        password,
        rememberMe: true,
      });
      if (!response.ok()) continue;

      const me = await requestJson(api, "GET", "/api/users/me");
      if (!me.response.ok()) continue;

      pushResult(`${label} login`, true, `Authenticated via ${endpoint}`);
      return me.body;
    } catch {
      // try next endpoint
    }
  }

  pushResult(`${label} login`, false, "Unable to authenticate");
  return null;
}

function expectStatus(name, status, expected, details = "") {
  const ok = status === expected;
  pushResult(name, ok, `expected=${expected} got=${status}${details ? ` ${details}` : ""}`);
}

async function runGuestChecks() {
  const guest = await playwrightRequest.newContext({ baseURL });
  try {
    const checks = [
      ["Guest users list", "GET", "/api/users", 401],
      ["Guest templates list", "GET", "/api/templates", 401],
      ["Guest documents list", "GET", "/api/documents", 401],
      ["Guest personas list", "GET", "/api/personas", 401],
      ["Guest template taxonomy", "GET", "/api/template-taxonomy", 401],
    ];

    for (const [name, method, route, expected] of checks) {
      const { response } = await requestJson(guest, method, route);
      expectStatus(name, response.status(), expected);
    }
  } finally {
    await guest.dispose();
  }
}

async function runEmployeeChecks() {
  const employee = await playwrightRequest.newContext({ baseURL });
  try {
    const me = await login(employee, employeeEmail, employeePassword, "Employee");
    if (!me) return;

    const roleNames = Array.isArray(me?.roles) ? me.roles.map((role) => role?.name).filter(Boolean) : [];
    pushResult("Employee role check", roleNames.includes("employee"), `roles=${roleNames.join(",") || "none"}`);

    const allowedChecks = [
      ["Employee templates list", "GET", "/api/templates", 200],
      ["Employee documents list", "GET", "/api/documents", 200],
      ["Employee personas list", "GET", "/api/personas", 200],
    ];

    for (const [name, method, route, expected] of allowedChecks) {
      const { response } = await requestJson(employee, method, route);
      expectStatus(name, response.status(), expected);
    }

    const deniedChecks = [
      ["Employee users list denied", "GET", "/api/users", 403],
      ["Employee template create denied", "POST", "/api/templates", 403, {
        title: "Test",
        documentType: { name: "test" },
        category: { name: "test" },
      }],
      ["Employee template import denied", "POST", "/api/templates/import", 403, {
        title: "Test",
        documentType: "test",
        category: "test",
      }],
      ["Employee template taxonomy denied", "GET", "/api/template-taxonomy", 403],
      ["Employee template assets denied", "GET", "/api/template-assets", 403],
    ];

    for (const [name, method, route, expected, payload] of deniedChecks) {
      const { response } = await requestJson(employee, method, route, payload);
      expectStatus(name, response.status(), expected);
    }
  } finally {
    await employee.dispose();
  }
}

async function runAdminChecks() {
  const admin = await playwrightRequest.newContext({ baseURL });
  try {
    const me = await login(admin, adminEmail, adminPassword, "Admin");
    if (!me) return;

    const roleNames = Array.isArray(me?.roles) ? me.roles.map((role) => role?.name).filter(Boolean) : [];
    pushResult("Admin role check", roleNames.includes("admin"), `roles=${roleNames.join(",") || "none"}`);

    const checks = [
      ["Admin users list", "GET", "/api/users", 200],
      ["Admin template taxonomy", "GET", "/api/template-taxonomy", 200],
      ["Admin template assets", "GET", "/api/template-assets", 200],
      ["Admin templates list", "GET", "/api/templates", 200],
      ["Admin documents list", "GET", "/api/documents", 200],
    ];

    for (const [name, method, route, expected] of checks) {
      const { response } = await requestJson(admin, method, route);
      expectStatus(name, response.status(), expected);
    }
  } finally {
    await admin.dispose();
  }
}

async function saveReport() {
  await fs.mkdir(outDir, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    baseURL,
    passCount: results.filter((result) => result.ok).length,
    failCount: results.filter((result) => !result.ok).length,
    results,
  };
  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

async function run() {
  await runGuestChecks();
  await runEmployeeChecks();
  await runAdminChecks();
}

run()
  .catch((error) => {
    pushResult("Permissions runner crash", false, error instanceof Error ? error.message : String(error));
  })
  .finally(async () => {
    const summary = await saveReport();
    if (summary.failCount > 0) {
      process.exitCode = 1;
    }
  });
