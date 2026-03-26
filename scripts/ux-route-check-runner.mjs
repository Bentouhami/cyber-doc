import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";
const outDir = path.join(process.cwd(), "tmp", "ux-check");

const RAW_KEY_RE = /\b(?:templates|documents|employees|common|navigation)\.[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+\b/g;

const viewportProfiles = [
  { id: "desktop", width: 1366, height: 900 },
  { id: "mobile", width: 390, height: 844 },
];

const languageProfiles = [
  { id: "fr", cookieValue: "fr" },
  { id: "ar", cookieValue: "ar" },
];

async function loginAsAdmin(page) {
  const request = page.request;
  const endpoints = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-in/credential",
    "/api/auth/sign-in",
  ];
  const traces = [];

  for (const endpoint of endpoints) {
    try {
      const response = await request.post(`${baseURL}${endpoint}`, {
        data: { email: adminEmail, password: adminPassword, rememberMe: true },
      });
      let responseSnippet = "";
      if (!response.ok()) {
        responseSnippet = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 120);
      }
      traces.push(`${endpoint}:${response.status()}${responseSnippet ? `:${responseSnippet}` : ""}`);
      if (!response.ok()) continue;
      const me = await request.get(`${baseURL}/api/users/me`);
      traces.push(`/api/users/me:${me.status()} after ${endpoint}`);
      if (!me.ok()) continue;
      const body = await me.json().catch(() => null);
      const isAdmin = Array.isArray(body?.roles) && body.roles.some((role) => role?.name === "admin");
      if (isAdmin) {
        return { ok: true, details: `Authenticated via ${endpoint}` };
      }
    } catch {
      traces.push(`${endpoint}:exception`);
    }
  }

  // UI fallback
  try {
    await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page
      .waitForURL(
        (url) =>
          url.pathname.startsWith("/admin") ||
          url.pathname.startsWith("/documents") ||
          url.pathname === "/",
        { timeout: 12000 },
      )
      .catch(() => {
        traces.push("ui-login:waitForURL-timeout");
      });

    const meRes = await request.get(`${baseURL}/api/users/me`);
    traces.push(`/api/users/me:${meRes.status()} after ui-login`);
    if (meRes.ok()) {
      const body = await meRes.json().catch(() => null);
      const isAdmin = Array.isArray(body?.roles) && body.roles.some((role) => role?.name === "admin");
      if (isAdmin) {
        const current = new URL(page.url());
        return { ok: true, details: `UI login, current ${current.pathname}` };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    traces.push(`ui-login:exception:${message.slice(0, 120)}`);
  }

  const currentPath = (() => {
    try {
      return new URL(page.url()).pathname;
    } catch {
      return "n/a";
    }
  })();
  return { ok: false, details: `Auth failed, current=${currentPath}, traces=${traces.join(" | ")}` };
}

async function getSampleDocumentId(page) {
  const response = await page.request.get(`${baseURL}/api/documents?page=1&pageSize=1`);
  if (!response.ok()) return null;
  const body = await response.json().catch(() => null);
  return body?.data?.[0]?.id ?? null;
}

async function evaluateFieldQuality(page) {
  return page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll("input, textarea"));
    let important = 0;
    let lacking = 0;

    for (const element of fields) {
      if (!(element instanceof HTMLElement)) continue;
      if (element instanceof HTMLInputElement && ["hidden", "checkbox", "radio", "file"].includes(element.type)) {
        continue;
      }

      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (element.offsetParent === null && style.position !== "fixed") continue;

      important += 1;
      const placeholder =
        "placeholder" in element && typeof element.placeholder === "string"
          ? String(element.placeholder ?? "").trim()
          : "";
      const ariaLabel = element.getAttribute("aria-label")?.trim() ?? "";
      const id = element.getAttribute("id");
      const explicitLabel = id
        ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() ?? ""
        : "";
      const implicitLabel = element.closest("label")?.textContent?.trim() ?? "";
      const hasLabel = Boolean(explicitLabel || implicitLabel || ariaLabel);
      const hasPlaceholder = Boolean(placeholder);

      if (!hasLabel || !hasPlaceholder) {
        lacking += 1;
      }
    }

    return { important, lacking };
  });
}

async function evaluateKeyboardFocusFlow(page) {
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableCount = await page.locator(focusableSelector).count();
  const visibleFocusableCount = await page.evaluate((selector) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    return nodes.filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length;
  }, focusableSelector);

  if (focusableCount === 0 || visibleFocusableCount === 0) {
    return {
      ok: true,
      focusableCount,
      visibleFocusableCount,
      reason: "no-visible-focusable-elements",
    };
  }

  await page.mouse.click(12, 12);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(80);
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || !(el instanceof HTMLElement)) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: el.className || null,
      visible:
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden",
    };
  });

  await page.keyboard.press("Tab");
  await page.waitForTimeout(80);
  const second = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || !(el instanceof HTMLElement)) return null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: el.className || null,
    };
  });

  const firstOk = Boolean(first && first.tag !== "body" && first.visible);
  const movedOnSecond =
    Boolean(second && first) &&
    (second.tag !== first.tag || second.id !== first.id || second.className !== first.className);

  return {
    ok: firstOk && movedOnSecond,
    focusableCount,
    visibleFocusableCount,
    first,
    second,
    firstOk,
    movedOnSecond,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const checks = [];

  try {
    for (const language of languageProfiles) {
      for (const viewport of viewportProfiles) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });

        const page = await context.newPage();
        const auth = await loginAsAdmin(page);
        checks.push({
          profile: `${language.id}-${viewport.id}`,
          route: "auth",
          ok: auth.ok,
          details: auth.details,
        });
        if (!auth.ok) {
          await context.close();
          continue;
        }
        await context.addCookies([
          {
            name: "cyberdoc_lang",
            value: language.cookieValue,
            domain: "127.0.0.1",
            path: "/",
            httpOnly: false,
            secure: false,
            sameSite: "Lax",
          },
        ]);

        const sampleDocumentId = await getSampleDocumentId(page);
        const routes = [
          "/admin/employees",
          "/admin/templates",
          "/admin/templates/new",
          "/documents",
          "/documents/create?entryMode=new",
          sampleDocumentId ? `/documents/${sampleDocumentId}` : "/documents",
        ];

        for (const route of routes) {
          const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
          const status = response?.status() ?? 0;
          const pageText = (await page.textContent("body")) ?? "";
          const rawKeys = Array.from(new Set(pageText.match(RAW_KEY_RE) ?? []));
          const hasRuntimeError = /application error|runtime error|failed to compile|module not found/i.test(pageText);
          const htmlDir = await page.evaluate(() => document.documentElement.getAttribute("dir") || "");
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          const fieldQuality = await evaluateFieldQuality(page);
          const keyboardFlow = await evaluateKeyboardFocusFlow(page);

          const expectDir = language.id === "ar" ? "rtl" : "ltr";
          const dirOk = htmlDir === expectDir;
          const overflowOk = overflow <= 2;
          const keysOk = rawKeys.length === 0;
          const fieldWarning = fieldQuality.important > 0 && fieldQuality.lacking > 0;
          const ok =
            status < 400 &&
            dirOk &&
            overflowOk &&
            keysOk &&
            !hasRuntimeError &&
            keyboardFlow.ok;

          checks.push({
            profile: `${language.id}-${viewport.id}`,
            route,
            ok,
            details: `status=${status} dir=${htmlDir} overflow=${overflow} rawKeys=${rawKeys.length} runtimeError=${hasRuntimeError} fields=${fieldQuality.important} lacking=${fieldQuality.lacking} fieldWarning=${fieldWarning} keyboardOk=${keyboardFlow.ok} focusable=${keyboardFlow.focusableCount}`,
            rawKeys,
            keyboardFlow,
          });
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const passCount = checks.filter((check) => check.ok).length;
  const failCount = checks.length - passCount;
  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    passCount,
    failCount,
    checks,
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(report, null, 2), "utf8");

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("ux-route-check-runner failed:", error);
  process.exitCode = 1;
});
