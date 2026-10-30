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

async function expectRejectedLogin(api, email, password, label) {
  const { response, body } = await requestJson(api, "POST", "/api/auth/sign-in/email", {
    email,
    password,
    rememberMe: true,
  });
  const responseText = JSON.stringify(body).toLowerCase();
  const isGeneric = !responseText.includes("deactiv") && !responseText.includes("deleted");
  pushResult(
    label,
    response.status() === 401 && isGeneric,
    `expected=401 generic-error got=${response.status()} generic=${isGeneric}`,
  );
}

function expectStatus(name, status, expected, details = "") {
  const ok = status === expected;
  pushResult(name, ok, `expected=${expected} got=${status}${details ? ` ${details}` : ""}`);
}

async function runGuestChecks() {
  const guest = await playwrightRequest.newContext({ baseURL });
  try {
    const loginPage = await guest.get("/");
    const csp = loginPage.headers()["content-security-policy"] ?? "";
    const scriptDirective = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src ")) ?? "";
    const nonceCspOk =
      loginPage.ok() &&
      /'nonce-[A-Za-z0-9_-]+'/.test(scriptDirective) &&
      scriptDirective.includes("'strict-dynamic'") &&
      !scriptDirective.includes("'unsafe-inline'");
    pushResult(
      "Production nonce CSP",
      nonceCspOk,
      `HTTP ${loginPage.status()} nonce=${/'nonce-/.test(scriptDirective)} unsafeInline=${scriptDirective.includes("'unsafe-inline'")}`,
    );

    const checks = [
      ["Guest users list", "GET", "/api/users", 401],
      ["Guest templates list", "GET", "/api/templates", 401],
      ["Guest documents list", "GET", "/api/documents", 401],
      ["Guest document creators", "GET", "/api/document-creators", 401],
      ["Guest document statuses", "GET", "/api/document-statuses", 401],
      ["Guest personas list", "GET", "/api/personas", 401],
      ["Guest template taxonomy", "GET", "/api/template-taxonomy", 401],
      ["Guest activity logs", "GET", "/api/activity-logs", 401],
    ];

    for (const [name, method, route, expected] of checks) {
      const { response } = await requestJson(guest, method, route);
      expectStatus(name, response.status(), expected);
    }


    const signUp = await requestJson(guest, "POST", "/api/auth/sign-up/email", {
      email: `public-signup-${Date.now()}@example.invalid`,
      password: "Aa12345678!",
      name: "Public Signup",
    });
    expectStatus("Public signup disabled", signUp.response.status(), 400);
  } finally {
    await guest.dispose();
  }
}

async function runAccountLifecycleChecks(admin) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `permissions-${unique}@example.invalid`;
  const initialPassword = "Aa12345678!";
  const nextPassword = "Bb12345678!";
  let userId = null;
  const contexts = [];

  try {
    const created = await requestJson(admin, "POST", "/api/users", {
      email,
      password: initialPassword,
      firstName: "Permissions",
      lastName: "Lifecycle",
      roleNames: ["employee"],
    });
    expectStatus("Lifecycle user created", created.response.status(), 201);
    userId = typeof created.body?.id === "string" ? created.body.id : null;
    if (!userId) {
      pushResult("Lifecycle user id returned", false, "Creation response has no id");
      return;
    }
    pushResult("Lifecycle user id returned", true);

    const initialSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(initialSession);
    await login(initialSession, email, initialPassword, "Lifecycle initial");

    const deactivated = await requestJson(admin, "PATCH", `/api/users/${userId}`, {
      isActive: false,
    });
    expectStatus("Lifecycle user deactivated", deactivated.response.status(), 200);

    const revokedAfterDeactivation = await requestJson(initialSession, "GET", "/api/users/me");
    expectStatus(
      "Existing session revoked after deactivation",
      revokedAfterDeactivation.response.status(),
      401,
    );

    const blockedSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(blockedSession);
    await expectRejectedLogin(
      blockedSession,
      email,
      initialPassword,
      "Deactivated user login rejected generically",
    );

    const reactivated = await requestJson(admin, "PATCH", `/api/users/${userId}`, {
      isActive: true,
    });
    expectStatus("Lifecycle user reactivated", reactivated.response.status(), 200);

    const reactivatedSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(reactivatedSession);
    await login(reactivatedSession, email, initialPassword, "Lifecycle reactivated");

    const passwordChanged = await requestJson(admin, "PATCH", `/api/users/${userId}`, {
      password: nextPassword,
    });
    expectStatus("Lifecycle password changed", passwordChanged.response.status(), 200);

    const revokedAfterPasswordChange = await requestJson(
      reactivatedSession,
      "GET",
      "/api/users/me",
    );
    expectStatus(
      "Existing session revoked after password change",
      revokedAfterPasswordChange.response.status(),
      401,
    );

    const oldPasswordSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(oldPasswordSession);
    await expectRejectedLogin(
      oldPasswordSession,
      email,
      initialPassword,
      "Old password rejected generically",
    );

    const currentSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(currentSession);
    await login(currentSession, email, nextPassword, "Lifecycle current password");

    const deleted = await requestJson(admin, "DELETE", `/api/users/${userId}`);
    expectStatus("Lifecycle user soft-deleted", deleted.response.status(), 200);

    const revokedAfterDelete = await requestJson(currentSession, "GET", "/api/users/me");
    expectStatus(
      "Existing session revoked after deletion",
      revokedAfterDelete.response.status(),
      401,
    );

    const deletedLoginSession = await playwrightRequest.newContext({ baseURL });
    contexts.push(deletedLoginSession);
    await expectRejectedLogin(
      deletedLoginSession,
      email,
      nextPassword,
      "Deleted user login rejected generically",
    );
  } finally {
    if (userId) {
      await requestJson(admin, "DELETE", `/api/users/${userId}`).catch(() => null);
    }
    await Promise.all(contexts.map((context) => context.dispose()));
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
      ["Employee document creators", "GET", "/api/document-creators", 200],
      ["Employee document statuses", "GET", "/api/document-statuses", 200],
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
      [
        "Employee raw template document denied",
        "GET",
        "/api/templates/vehicle-sale-contract/asset",
        403,
      ],
      ["Employee activity logs denied", "GET", "/api/activity-logs", 403],
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
      ["Admin activity logs", "GET", "/api/activity-logs?page=1&pageSize=5", 200],
    ];

    for (const [name, method, route, expected] of checks) {
      const { response } = await requestJson(admin, method, route);
      expectStatus(name, response.status(), expected);
    }

    // Produce known audit entries before validating query/filter behavior so the
    // suite also works against a freshly seeded database.
    await runAccountLifecycleChecks(admin);

    const audit = await requestJson(admin, "GET", "/api/activity-logs?page=1&pageSize=1");
    const firstAudit = audit.body?.data?.[0];
    const auditShapeOk =
      audit.response.status() === 200 &&
      Array.isArray(audit.body?.data) &&
      audit.body.data.length <= 1 &&
      audit.body?.page === 1 &&
      audit.body?.pageSize === 1 &&
      Number.isInteger(audit.body?.total) &&
      (!firstAudit ||
        (typeof firstAudit.activityType === "string" &&
          typeof firstAudit.createdAt === "string" &&
          firstAudit.actor &&
          !("email" in firstAudit.actor) &&
          !("userAgent" in firstAudit)));
    pushResult(
      "Admin activity logs paginated and minimized",
      auditShapeOk,
      `HTTP ${audit.response.status()} returned=${audit.body?.data?.length ?? "n/a"}`,
    );

    if (firstAudit?.activityType) {
      const filteredAudit = await requestJson(
        admin,
        "GET",
        `/api/activity-logs?page=1&pageSize=10&activityType=${encodeURIComponent(firstAudit.activityType)}`,
      );
      const filterOk =
        filteredAudit.response.status() === 200 &&
        Array.isArray(filteredAudit.body?.data) &&
        filteredAudit.body.data.every(
          (entry) => entry?.activityType === firstAudit.activityType,
        );
      pushResult(
        "Admin activity logs filter",
        filterOk,
        `HTTP ${filteredAudit.response.status()} returned=${filteredAudit.body?.data?.length ?? "n/a"}`,
      );
    } else {
      pushResult("Admin activity logs filter", false, "No seeded activity available");
    }

    const invalidAudit = await requestJson(
      admin,
      "GET",
      "/api/activity-logs?pageSize=101",
    );
    expectStatus(
      "Admin activity logs invalid pagination",
      invalidAudit.response.status(),
      400,
    );

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
