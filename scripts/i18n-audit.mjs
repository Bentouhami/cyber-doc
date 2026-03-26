import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "hooks", "lib", "services"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, nextKey));
    } else {
      out[nextKey] = value;
    }
  }
  return out;
}

function extractKeysFromSource(source) {
  const keys = new Set();
  const regex = /\bt\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(source))) {
    const key = match[1];
    if (!key.includes("${")) keys.add(key);
  }
  return keys;
}

const files = ROOTS.flatMap((root) => walk(root));
const usedKeys = new Set();

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const key of extractKeysFromSource(source)) usedKeys.add(key);
}

const frRaw = JSON.parse(fs.readFileSync("locales/fr/common.json", "utf8"));
const arRaw = JSON.parse(fs.readFileSync("locales/ar/common.json", "utf8"));
const fr = flatten(frRaw);
const ar = flatten(arRaw);

const used = [...usedKeys].sort();
const frKeys = Object.keys(fr).sort();
const arKeys = Object.keys(ar).sort();

const missingInFr = used.filter((key) => !(key in fr));
const missingInAr = used.filter((key) => !(key in ar));
const frOnly = frKeys.filter((key) => !(key in ar));
const arOnly = arKeys.filter((key) => !(key in fr));

console.log("i18n audit summary");
console.log(`- used keys: ${used.length}`);
console.log(`- missing in fr: ${missingInFr.length}`);
console.log(`- missing in ar: ${missingInAr.length}`);
console.log(`- fr-only keys: ${frOnly.length}`);
console.log(`- ar-only keys: ${arOnly.length}`);

if (missingInFr.length) {
  console.log("\nMissing in fr:");
  for (const key of missingInFr) console.log(`- ${key}`);
}

if (missingInAr.length) {
  console.log("\nMissing in ar:");
  for (const key of missingInAr) console.log(`- ${key}`);
}

if (frOnly.length) {
  console.log("\nFR-only keys:");
  for (const key of frOnly) console.log(`- ${key}`);
}

if (arOnly.length) {
  console.log("\nAR-only keys:");
  for (const key of arOnly) console.log(`- ${key}`);
}

if (missingInFr.length || missingInAr.length) {
  process.exitCode = 1;
}
