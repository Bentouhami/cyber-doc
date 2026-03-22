import fs from "node:fs/promises";
import path from "node:path";
const outDir = path.join(process.cwd(), "tmp", "secret-scan");

const skipPathPrefixes = [
  ".codex/",
  ".agents/",
  "node_modules/",
  ".next/",
  ".git/",
  "tmp/",
  "docs/new-to-test/",
];

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".env",
  ".txt",
  ".sql",
  ".ps1",
  ".sh",
  ".prisma",
  ".html",
  ".css",
]);

const patterns = [
  { name: "GitHub token", re: /\b(?:ghp|gho)_[A-Za-z0-9]{36}\b/g },
  { name: "GitHub PAT", re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: "Private key block", re: /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/g },
  { name: "Mongo URL", re: /mongodb(?:\+srv)?:\/\/[^\s"'`]+/g },
  { name: "Postgres URL", re: /postgres(?:ql)?:\/\/[^\s"'`]+/g },
  { name: "Env secret assignment", re: /\b(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|JWT_SECRET|SECRET_KEY)\s*=\s*[^\s]+/g },
];

function shouldSkipPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return skipPathPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.has(ext);
}

function toLineCol(content, index) {
  const pre = content.slice(0, index);
  const lines = pre.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function isPlaceholderSnippet(snippet) {
  const s = snippet.toLowerCase();
  return (
    s.includes("your_api_key") ||
    s.includes("your key") ||
    s.includes("example") ||
    s.includes("...") ||
    s.includes("<") ||
    s.includes("localhost") ||
    s.includes("user:password")
  );
}

async function listCandidateFiles() {
  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(process.cwd(), full).replaceAll("\\", "/");
      if (shouldSkipPath(rel)) continue;
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isTextFile(rel)) continue;
      files.push(rel);
    }
  }

  await walk(process.cwd());
  return files;
}

async function run() {
  const files = await listCandidateFiles();
  const findings = [];

  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern.re)) {
        const idx = match.index ?? 0;
        const { line, col } = toLineCol(content, idx);
        findings.push({
          file: file.replaceAll("\\", "/"),
          line,
          col,
          type: pattern.name,
          snippet: String(match[0]).slice(0, 120),
        });
      }
    }
  }

  const filteredFindings = findings.filter((finding) => !isPlaceholderSnippet(finding.snippet));

  const summary = {
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    findingCount: filteredFindings.length,
    findings: filteredFindings,
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "results.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  if (filteredFindings.length > 0) {
    console.error(`[secret-scan] found ${filteredFindings.length} potential secret(s).`);
    process.exitCode = 1;
  } else {
    console.log(`[secret-scan] no secrets found in ${files.length} file(s).`);
  }
}

run().catch((error) => {
  console.error("[secret-scan] failed:", error);
  process.exit(1);
});
