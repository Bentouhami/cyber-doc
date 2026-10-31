import { chromium } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const route = process.env.INSPECT_ROUTE ?? "/admin/templates/new";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@cybercafe.com";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "12345678";

function summarizeElement(element) {
  const id = element.id || "";
  const name = element.getAttribute("name") || "";
  const type = element.getAttribute("type") || element.tagName.toLowerCase();
  const placeholder = "placeholder" in element ? String(element.placeholder ?? "") : "";
  const ariaLabel = element.getAttribute("aria-label") || "";
  const hasPlaceholder = Boolean(placeholder.trim());
  const hasAria = Boolean(ariaLabel.trim());
  const explicitLabel = id
    ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() ?? ""
    : "";
  const implicitLabel = element.closest("label")?.textContent?.trim() ?? "";
  const hasLabel = Boolean(explicitLabel || implicitLabel || hasAria);

  return {
    tag: element.tagName.toLowerCase(),
    type,
    id,
    name,
    placeholder,
    ariaLabel,
    explicitLabel,
    implicitLabel,
    hasLabel,
    hasPlaceholder,
  };
}

async function loginAsAdmin(page) {
  const endpoints = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-in/credential",
    "/api/auth/sign-in",
  ];

  for (const endpoint of endpoints) {
    const response = await page.request.post(`${baseURL}${endpoint}`, {
      data: { email: adminEmail, password: adminPassword, rememberMe: true },
    });
    if (!response.ok()) continue;

    const me = await page.request.get(`${baseURL}/api/users/me`);
    if (!me.ok()) continue;

    const body = await me.json().catch(() => null);
    const isAdmin = Array.isArray(body?.roles) && body.roles.some((role) => role?.name === "admin");
    if (isAdmin) return true;
  }

  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    const authed = await loginAsAdmin(page);
    if (!authed) {
      throw new Error("Admin authentication failed");
    }

    await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });

    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("input, textarea, select"));
      const visible = elements.filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element instanceof HTMLInputElement && ["hidden", "checkbox", "radio", "file"].includes(element.type)) {
          return false;
        }
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (element.offsetParent === null && style.position !== "fixed") return false;
        return true;
      });

      const rows = visible.map((element) => summarizeElement(element));
      const lacking = rows.filter((row) => !row.hasLabel || !row.hasPlaceholder);
      return { total: rows.length, lackingCount: lacking.length, lacking };
    });

    console.log(JSON.stringify({ route, ...result }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
