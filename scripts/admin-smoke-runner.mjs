import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";
const outDir = path.join(process.cwd(), "tmp", "admin-smoke");

const results = [];

function pushResult(name, ok, details = "") {
  results.push({ name, ok, details });
}

async function ensureRouteOk(page, routePath, name) {
  const response = await page.goto(`${baseURL}${routePath}`, {
    waitUntil: "domcontentloaded",
  });
  const status = response?.status() ?? 0;
  if (status >= 400) {
    pushResult(name, false, `HTTP ${status} on ${routePath}`);
    return false;
  }

  const bodyText = (await page.textContent("body")) ?? "";
  const hasCrash = /application error|runtime error|module not found|failed to compile|cannot read properties/i.test(
    bodyText,
  );
  if (hasCrash) {
    pushResult(name, false, `Runtime error markers found on ${routePath}`);
    return false;
  }

  pushResult(name, true, `${routePath} loaded (HTTP ${status})`);
  return true;
}

async function loginAsAdmin(page) {
  const request = page.request;

  // Try API sign-in first to avoid UI timing differences in redirects.
  const apiLoginCandidates = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-in/credential",
    "/api/auth/sign-in",
  ];

  for (const endpoint of apiLoginCandidates) {
    try {
      const response = await request.post(`${baseURL}${endpoint}`, {
        data: { email: adminEmail, password: adminPassword, rememberMe: true },
      });
      if (response.ok) {
        const meRes = await request.get(`${baseURL}/api/users/me`);
        if (meRes.ok()) {
          const me = await meRes.json().catch(() => null);
          const isAdmin = Array.isArray(me?.roles) && me.roles.some((role) => role?.name === "admin");
          if (isAdmin) {
            pushResult("Admin login + redirect", true, `Authenticated via ${endpoint}`);
            return true;
          }
        }
      }
    } catch {
      // try next endpoint
    }
  }

  // Fallback to UI login flow if API login did not succeed.
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');
  await page
    .waitForURL((url) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/documents") || url.pathname === "/", {
      timeout: 12000,
    })
    .catch(() => {});

  const meRes = await request.get(`${baseURL}/api/users/me`);
  if (meRes.ok()) {
    const me = await meRes.json().catch(() => null);
    const isAdmin = Array.isArray(me?.roles) && me.roles.some((role) => role?.name === "admin");
    if (isAdmin) {
      const current = new URL(page.url());
      pushResult("Admin login + redirect", true, `UI login, current ${current.pathname}`);
      return true;
    }
  }

  const current = new URL(page.url());
  pushResult("Admin login + redirect", false, `Auth failed, current ${current.pathname}`);
  return false;
}

async function runEmployeesCrud(adminRequest) {
  const unique = Date.now().toString(36);
  const payload = {
    firstName: "Smoke",
    lastName: `Employee-${unique}`,
    email: `smoke.employee.${unique}@cyberdoc.local`,
    password: "Aa123456",
    roleNames: ["employee"],
  };

  const createRes = await adminRequest.post(`${baseURL}/api/users`, { data: payload });
  if (createRes.status() !== 201) {
    pushResult("Employees CRUD - create", false, `HTTP ${createRes.status()}`);
    return;
  }
  const created = await createRes.json();
  const userId = created?.id;
  pushResult("Employees CRUD - create", true, `Created ${userId}`);

  if (!userId) {
    pushResult("Employees CRUD - update", false, "No user id returned");
    pushResult("Employees CRUD - delete", false, "No user id returned");
    return;
  }

  const updateRes = await adminRequest.patch(`${baseURL}/api/users/${userId}`, {
    data: { firstName: "SmokeUpdated", isActive: false },
  });
  pushResult(
    "Employees CRUD - update",
    updateRes.status() === 200,
    `HTTP ${updateRes.status()}`,
  );

  const deleteRes = await adminRequest.delete(`${baseURL}/api/users/${userId}`);
  pushResult(
    "Employees CRUD - delete",
    deleteRes.status() === 200,
    `HTTP ${deleteRes.status()}`,
  );
}

async function runTemplateDuplicateGuard(adminRequest) {
  const listRes = await adminRequest.get(`${baseURL}/api/templates?active=false`);
  if (listRes.status() !== 200) {
    pushResult("Templates duplicate guard - list", false, `HTTP ${listRes.status()}`);
    pushResult("Templates duplicate guard - create API", false, "Skipped");
    pushResult("Templates duplicate guard - import API", false, "Skipped");
    return;
  }

  const templates = await listRes.json();
  pushResult("Templates duplicate guard - list", Array.isArray(templates), `Count ${templates?.length ?? 0}`);
  if (!Array.isArray(templates) || templates.length === 0) {
    pushResult("Templates duplicate guard - create API", false, "No template sample available");
    pushResult("Templates duplicate guard - import API", false, "No template sample available");
    return;
  }

  const sample = templates[0];
  const detailRes = await adminRequest.get(`${baseURL}/api/templates/${sample.slug}`);
  if (detailRes.status() !== 200) {
    pushResult("Templates duplicate guard - sample detail", false, `HTTP ${detailRes.status()}`);
    pushResult("Templates duplicate guard - create API", false, "Skipped");
    pushResult("Templates duplicate guard - import API", false, "Skipped");
    return;
  }
  pushResult("Templates duplicate guard - sample detail", true, `Slug ${sample.slug}`);
  const detail = await detailRes.json();

  const uniqueSlug = `smoke-dup-${Date.now().toString(36)}`;

  const createPayload = {
    slug: uniqueSlug,
    title: detail.title,
    titleAr: detail.titleAr ?? null,
    locale: detail.locale ?? "ar-MA",
    documentType: {
      name: detail.documentType?.name ?? "CUSTOM_REQUEST",
      nameAr: detail.documentType?.nameAr ?? "طلب خاص",
    },
    category: {
      name: detail.category?.name ?? "custom_client_request",
      nameAr: detail.category?.nameAr ?? "طلب عميل خاص",
    },
    contentHtml: "<p>{{client.fullName}}</p>",
  };

  const createRes = await adminRequest.post(`${baseURL}/api/templates`, {
    data: createPayload,
  });
  const createBody = await createRes.json().catch(() => ({}));
  const createGuardOk = createRes.status() === 409 && createBody?.code === "DUPLICATE_CANDIDATE";
  pushResult(
    "Templates duplicate guard - create API",
    createGuardOk,
    `HTTP ${createRes.status()} code=${createBody?.code ?? "n/a"}`,
  );

  const importPayload = {
    ...createPayload,
    slug: `${uniqueSlug}-import`,
    language: detail.language ?? "fr",
  };

  const importRes = await adminRequest.post(`${baseURL}/api/templates/import`, {
    data: importPayload,
  });
  const importBody = await importRes.json().catch(() => ({}));
  const importGuardOk = importRes.status() === 409 && importBody?.code === "DUPLICATE_CANDIDATE";
  pushResult(
    "Templates duplicate guard - import API",
    importGuardOk,
    `HTTP ${importRes.status()} code=${importBody?.code ?? "n/a"}`,
  );
}

async function runTemplateCrudAndImport(adminRequest) {
  const unique = Date.now().toString(36);
  const createdSlugs = [];

  const baseCreatePayload = {
    slug: `smoke-template-${unique}`,
    title: `Smoke Template ${unique}`,
    titleAr: `نموذج اختبار ${unique}`,
    description: "Smoke template lifecycle validation",
    locale: "ar-MA",
    language: "ar",
    contentHtml: "<p>{{client.fullName}}</p>",
    contentCss: "body { font-family: Arial, sans-serif; }",
    documentType: {
      name: `SMOKE_TYPE_${unique}`,
      nameAr: "نوع اختبار",
    },
    category: {
      name: `smoke_category_${unique}`,
      nameAr: "فئة اختبار",
    },
  };

  const createRes = await adminRequest.post(`${baseURL}/api/templates`, {
    data: baseCreatePayload,
  });
  const createBody = await createRes.json().catch(() => ({}));
  const createdSlug = createBody?.slug;
  const createOk = createRes.status() === 201 && typeof createdSlug === "string";
  pushResult(
    "Templates CRUD - create",
    createOk,
    `HTTP ${createRes.status()} slug=${createdSlug ?? "n/a"}`,
  );
  if (!createOk) {
    return;
  }
  createdSlugs.push(createdSlug);

  const detailRes = await adminRequest.get(`${baseURL}/api/templates/${createdSlug}`);
  pushResult(
    "Templates CRUD - detail",
    detailRes.status() === 200,
    `HTTP ${detailRes.status()}`,
  );

  const validateRes = await adminRequest.get(
    `${baseURL}/api/templates/${createdSlug}/validate`,
  );
  const validateBody = await validateRes.json().catch(() => ({}));
  const validateOk =
    validateRes.status() === 200 &&
    typeof validateBody === "object" &&
    Array.isArray(validateBody.placeholders);
  pushResult(
    "Templates API - validate",
    validateOk,
    `HTTP ${validateRes.status()} placeholders=${Array.isArray(validateBody?.placeholders) ? validateBody.placeholders.length : "n/a"}`,
  );

  const renderTestRes = await adminRequest.post(
    `${baseURL}/api/templates/${createdSlug}/render-test`,
  );
  const renderType = renderTestRes.headers()["content-type"] ?? "";
  const renderTestOk =
    renderTestRes.status() === 200 && renderType.includes("application/pdf");
  pushResult(
    "Templates API - render test",
    renderTestOk,
    `HTTP ${renderTestRes.status()} content-type=${renderType || "n/a"}`,
  );

  const updateRes = await adminRequest.patch(`${baseURL}/api/templates/${createdSlug}`, {
    data: {
      title: `Smoke Template Updated ${unique}`,
      description: "Updated by smoke test",
    },
  });
  pushResult(
    "Templates CRUD - edit",
    updateRes.status() === 200,
    `HTTP ${updateRes.status()}`,
  );

  const archiveRes = await adminRequest.patch(`${baseURL}/api/templates/${createdSlug}`, {
    data: {
      isActive: false,
      metadata: {
        archivedAt: new Date().toISOString(),
      },
    },
  });
  pushResult(
    "Templates CRUD - archive",
    archiveRes.status() === 200,
    `HTTP ${archiveRes.status()}`,
  );

  const duplicateRes = await adminRequest.post(
    `${baseURL}/api/templates/${createdSlug}/duplicate`,
  );
  const duplicateBody = await duplicateRes.json().catch(() => ({}));
  const duplicateSlug = duplicateBody?.slug;
  const duplicateOk = duplicateRes.status() === 201 && typeof duplicateSlug === "string";
  pushResult(
    "Templates CRUD - duplicate",
    duplicateOk,
    `HTTP ${duplicateRes.status()} slug=${duplicateSlug ?? "n/a"}`,
  );
  if (duplicateOk) {
    createdSlugs.push(duplicateSlug);
  }

  const importPayload = {
    slug: `smoke-import-${unique}`,
    title: `Smoke Import ${unique}`,
    titleAr: `استيراد اختبار ${unique}`,
    description: "Smoke import template validation",
    locale: "fr-MA",
    language: "fr",
    contentHtml: "<p>{{client.fullName}}</p>",
    contentCss: "body { font-family: Arial, sans-serif; }",
    documentType: {
      name: `SMOKE_IMPORT_TYPE_${unique}`,
      nameAr: "نوع استيراد",
    },
    category: {
      name: `smoke_import_category_${unique}`,
      nameAr: "فئة استيراد",
    },
  };

  const importRes = await adminRequest.post(`${baseURL}/api/templates/import`, {
    data: importPayload,
  });
  const importBody = await importRes.json().catch(() => ({}));
  const importSlug = importBody?.slug;
  const importOk = importRes.status() === 200 && typeof importSlug === "string";
  pushResult(
    "Templates Import - create",
    importOk,
    `HTTP ${importRes.status()} slug=${importSlug ?? "n/a"}`,
  );
  if (importOk) {
    createdSlugs.push(importSlug);
  }

  const duplicateCandidatePayload = {
    ...importPayload,
    slug: `smoke-import-dup-${unique}`,
  };
  const dupWarnRes = await adminRequest.post(`${baseURL}/api/templates/import`, {
    data: duplicateCandidatePayload,
  });
  const dupWarnBody = await dupWarnRes.json().catch(() => ({}));
  const dupWarnOk =
    dupWarnRes.status() === 409 && dupWarnBody?.code === "DUPLICATE_CANDIDATE";
  pushResult(
    "Templates Import - duplicate warning",
    dupWarnOk,
    `HTTP ${dupWarnRes.status()} code=${dupWarnBody?.code ?? "n/a"}`,
  );

  const dupOverrideRes = await adminRequest.post(`${baseURL}/api/templates/import`, {
    data: {
      ...duplicateCandidatePayload,
      slug: `smoke-import-override-${unique}`,
      forceDuplicateOverride: true,
    },
  });
  const dupOverrideBody = await dupOverrideRes.json().catch(() => ({}));
  const dupOverrideSlug = dupOverrideBody?.slug;
  const dupOverrideOk =
    dupOverrideRes.status() === 200 && typeof dupOverrideSlug === "string";
  const dupOverrideDetails = `HTTP ${dupOverrideRes.status()} slug=${dupOverrideSlug ?? "n/a"} code=${dupOverrideBody?.code ?? "n/a"} message=${dupOverrideBody?.message ?? "n/a"}`;
  pushResult(
    "Templates Import - duplicate override",
    dupOverrideOk,
    dupOverrideDetails,
  );
  if (dupOverrideOk) {
    createdSlugs.push(dupOverrideSlug);
  }

  for (const slug of createdSlugs) {
    const deleteRes = await adminRequest.delete(`${baseURL}/api/templates/${slug}`);
    pushResult(
      `Templates cleanup - delete ${slug}`,
      deleteRes.status() === 200,
      `HTTP ${deleteRes.status()}`,
    );
  }
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAsAdmin(page);
    await ensureRouteOk(page, "/admin", "Admin home renders");
    await ensureRouteOk(page, "/admin/employees", "Admin employees page renders");
    await ensureRouteOk(page, "/admin/templates", "Admin templates list renders");
    await ensureRouteOk(page, "/admin/templates/new", "Admin template create renders");
    await ensureRouteOk(page, "/admin/templates/import", "Admin template import renders");
    await ensureRouteOk(page, "/admin/templates/requests", "Admin template requests renders");

    await runEmployeesCrud(page.request);
    await runTemplateDuplicateGuard(page.request);
    await runTemplateCrudAndImport(page.request);

    await context.close();
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseURL,
    adminEmail,
    passCount: results.filter((r) => r.ok).length,
    failCount: results.filter((r) => !r.ok).length,
    results,
  };

  await fs.writeFile(
    path.join(outDir, "results.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  const checklistLines = [
    "# Admin Smoke Checklist Runner",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Base URL: ${summary.baseURL}`,
    `- Pass: ${summary.passCount}`,
    `- Fail: ${summary.failCount}`,
    "",
    "## Results",
    ...results.map(
      (entry) =>
        `- [${entry.ok ? "x" : " "}] ${entry.name}${entry.details ? ` (${entry.details})` : ""}`,
    ),
    "",
  ];

  await fs.writeFile(
    path.join(outDir, "checklist.md"),
    `${checklistLines.join("\n")}\n`,
    "utf8",
  );

  if (summary.failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
