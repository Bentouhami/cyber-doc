import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.RC_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = path.join(process.cwd(), "tmp", "rc-smoke");

const results = [];

function pushResult(name, ok, details = "") {
  results.push({ name, ok, details });
}

async function ensureRouteOk(page, routePath, name) {
  const response = await page.goto(`${baseURL}${routePath}`, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
  if (status >= 400) {
    pushResult(name, false, `HTTP ${status} on ${routePath}`);
    return false;
  }

  const bodyText = (await page.textContent("body")) ?? "";
  const hasCrash = /application error|runtime error|module not found|failed to compile|cannot read properties/i.test(bodyText);
  if (hasCrash) {
    pushResult(name, false, `Runtime error markers found on ${routePath}`);
    return false;
  }

  pushResult(name, true, `${routePath} loaded (HTTP ${status})`);
  return true;
}

async function login(page, email, password) {
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/documents") || url.pathname === "/",
    { timeout: 12000 },
  ).catch(() => {});
}

async function logout(page) {
  const logoutButton = page.locator("button:has(svg.lucide-log-out)").first();
  if ((await logoutButton.count()) === 0) {
    pushResult("Logout control visible", false, "Logout button not found");
    return false;
  }
  await Promise.all([
    logoutButton.click(),
  ]);
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/login", { timeout: 12000 }).catch(() => {});
  const url = new URL(page.url());
  const ok = url.pathname === "/" || url.pathname === "/login";
  pushResult("Logout flow", ok, `Current URL after logout: ${url.pathname}`);
  return ok;
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // Admin smoke
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await login(adminPage, "admin@cybercafe.com", "12345678");
    const adminUrl = new URL(adminPage.url());
    const adminRedirectOk = adminUrl.pathname.startsWith("/admin");
    pushResult("Admin login + redirect", adminRedirectOk, `Redirected to ${adminUrl.pathname}`);

    await ensureRouteOk(adminPage, "/admin/templates", "Admin templates list renders");
    await ensureRouteOk(adminPage, "/admin/templates/new", "Admin template create page renders");
    await ensureRouteOk(adminPage, "/admin/templates/import", "Admin template import page renders");
    await ensureRouteOk(adminPage, "/admin/employees", "Admin employees page renders");

    const templateLinks = adminPage.locator('a[href^="/admin/templates/"]');
    const templateLinkCount = await templateLinks.count();
    if (templateLinkCount > 0) {
      const href = await templateLinks.first().getAttribute("href");
      if (href && !href.endsWith("/new") && !href.endsWith("/import")) {
        await ensureRouteOk(adminPage, href, "Admin template detail page renders");
      } else {
        pushResult("Admin template detail page renders", false, "No detail link found in template list");
      }
    } else {
      pushResult("Admin template detail page renders", false, "No template links found");
    }

    const meRes = await adminPage.request.get(`${baseURL}/api/users/me`);
    pushResult("API /api/users/me (authenticated)", meRes.status() === 200, `HTTP ${meRes.status()}`);

    const tplRes = await adminPage.request.get(`${baseURL}/api/templates`);
    pushResult("API /api/templates (authenticated)", tplRes.status() === 200, `HTTP ${tplRes.status()}`);

    await logout(adminPage);
    await adminContext.close();

    // Employee smoke
    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();

    await login(employeePage, "employee@cybercafe.com", "12345678");
    const employeeUrl = new URL(employeePage.url());
    const employeeRedirectOk = employeeUrl.pathname.startsWith("/documents");
    pushResult("Employee login + redirect", employeeRedirectOk, `Redirected to ${employeeUrl.pathname}`);

    await ensureRouteOk(employeePage, "/documents", "Documents list renders");
    await ensureRouteOk(employeePage, "/documents/create", "Document create page renders");

    const docsRes = await employeePage.request.get(`${baseURL}/api/documents`);
    pushResult("API /api/documents (authenticated)", docsRes.status() === 200, `HTTP ${docsRes.status()}`);

    await logout(employeePage);
    await employeeContext.close();
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseURL,
    passCount: results.filter((r) => r.ok).length,
    failCount: results.filter((r) => !r.ok).length,
    results,
  };

  const jsonPath = path.join(outDir, "results.json");
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  const lines = [
    `# RC Smoke Results`,
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Base URL: ${baseURL}`,
    `- Pass: ${summary.passCount}`,
    `- Fail: ${summary.failCount}`,
    "",
  ];

  for (const entry of results) {
    lines.push(`- ${entry.ok ? "PASS" : "FAIL"} - ${entry.name}${entry.details ? ` (${entry.details})` : ""}`);
  }

  const mdPath = path.join(outDir, "results.md");
  await fs.writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");

  if (summary.failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
