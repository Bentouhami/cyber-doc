import fs from "node:fs/promises";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { chromium } from "playwright";

export type DocumentGenerationInput = {
  templatePath: string;
  data: Record<string, unknown>;
};

export async function generateDocxBuffer({ templatePath, data }: DocumentGenerationInput) {
  const templateBuffer = await fs.readFile(templatePath);
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render(data);

  return doc.getZip().generate({ type: "nodebuffer" });
}

const BLOCKED_PATHS = new Set(["__proto__", "prototype", "constructor"]);

export function buildNestedPayload(flat: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let cursor: Record<string, unknown> = result;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!part || BLOCKED_PATHS.has(part)) {
        break;
      }
      if (i === parts.length - 1) {
        cursor[part] = value;
      } else {
        if (typeof cursor[part] !== "object" || cursor[part] === null) {
          cursor[part] = {};
        }
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }

  return result;
}

export function resolveStorageRoot() {
  const storageDir = process.env.DOCS_STORAGE_DIR || "storage";
  return path.isAbsolute(storageDir) ? storageDir : path.resolve(process.cwd(), storageDir);
}

export function buildDocumentStoragePath(fileName: string) {
  return path.posix.join("documents", fileName);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHtmlTemplate(template: string, data: Record<string, unknown>) {
  const resolveValue = (key: string) =>
    key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, data);

  const resolveGenderSuffix = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return "";
    const femaleTokens = [
      "f",
      "female",
      "femme",
      "woman",
      "feminine",
      "féminin",
      "feminine",
      "أنثى",
      "انثى",
      "امرأة",
      "إمرأة",
      "مؤنث",
    ];
    const isFemale =
      femaleTokens.some((token) => normalized === token.toLowerCase()) ||
      normalized.includes("femme") ||
      normalized.includes("female") ||
      normalized.includes("fémin") ||
      normalized.includes("انث") ||
      normalized.includes("أنث");
    return isFemale ? "ة" : "";
  };

  return template.replace(/{{\s*([\w.]+)(?:[:\s]+([\w.]+))?\s*}}/g, (_, token: string, arg?: string) => {
    if (arg) {
      if (token === "genderSuffix") {
        return resolveGenderSuffix(resolveValue(arg));
      }
      return "";
    }
    const value = resolveValue(token);
    if (value === null || value === undefined) {
      return "";
    }
    const safeValue = escapeHtml(String(value));
    const hasLatin = /[A-Za-z]/.test(safeValue);
    const hasArabic = /[\u0600-\u06FF]/.test(safeValue);
    const shouldForceLtr = hasLatin || /\d.*[-/].*\d/.test(safeValue) || /[A-Z]{2,}/.test(safeValue);
    const shouldForceRtl = hasArabic && !hasLatin;
    if (shouldForceRtl) {
      return `<span class="rtl" dir="rtl">${safeValue}</span>`;
    }
    return shouldForceLtr ? `<span class="ltr" dir="ltr">${safeValue}</span>` : safeValue;
  });
}

const BASE_STYLES = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Tajawal", "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
}
.ltr {
  direction: ltr;
  unicode-bidi: isolate-override;
}
.rtl {
  direction: rtl;
  unicode-bidi: isolate-override;
}
.page {
  padding: 24px 32px;
}
h1, h2, h3 { margin: 0 0 12px; }
p { margin: 0 0 8px; }
table { width: 100%; border-collapse: collapse; }
td, th { padding: 6px 8px; border: 1px solid #e5e7eb; }
`;

function injectStyles(html: string, css?: string | null) {
  if (!css) return html;
  if (html.includes("</head>")) {
    return html.replace("</head>", `<style>${css}</style></head>`);
  }
  return `<style>${css}</style>${html}`;
}

export function ensureHtmlDocument(html: string, css?: string | null) {
  const trimmed = html.trim();
  const styleBlock = `${BASE_STYLES}${css ? `\n${css}` : ""}`;
  if (trimmed.includes("<html")) {
    return injectStyles(html, styleBlock);
  }
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${styleBlock}</style>
  </head>
  <body>
    <div class="page">${html}</div>
  </body>
</html>`;
}

export type PdfOptions = {
  format?: string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
};

export async function generatePdfBufferFromHtml(html: string, options?: PdfOptions, css?: string | null) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(ensureHtmlDocument(html, css), { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "screen" });
  const buffer = await page.pdf({
    format: options?.format ?? "A4",
    printBackground: true,
    margin: {
      top: options?.margin?.top ?? "1cm",
      right: options?.margin?.right ?? "1cm",
      bottom: options?.margin?.bottom ?? "1cm",
      left: options?.margin?.left ?? "1cm",
    },
  });
  await browser.close();
  return buffer;
}

export async function ensureStoragePath(relativePath: string) {
  const storageRoot = resolveStorageRoot();
  const absolutePath = path.join(storageRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
}
