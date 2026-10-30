param(
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$includePaths = @(
  ".dockerignore",
  ".env.example",
  ".gitattributes",
  ".gemini/settings.json",
  ".github",
  ".githooks",
  ".gitleaks.toml",
  ".gitignore",
  "AGENT.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CONSTRAINTS.md",
  "Dockerfile",
  "GEMINI.md",
  "README.md",
  "app",
  "components",
  "compose.yaml",
  "docker",
  "docs/README.md",
  "docs/decisions",
  "docs/engineering",
  "docs/features",
  "docs/finalization",
  "docs/project-state/feature-inventory.md",
  "hooks",
  "lib",
  "locales",
  "mappers",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "prisma",
  "prisma.config.ts",
  "proxy.ts",
  "scripts",
  "services",
  "tasks",
  "templates_docs",
  "tests",
  "tsconfig.json",
  "types"
)

$deferPrefixes = @(
  "tmp/",
  "storage/",
  "docs/new-to-test/",
  ".codex/skills/ui-ux-pro-max/",
  ".neon"
)

function Normalize-Path([string]$p) {
  return ($p -replace "\\","/")
}

$status = git status --porcelain
$entries = @()
foreach ($line in $status) {
  if ($line.Length -lt 4) { continue }
  $path = Normalize-Path($line.Substring(3))
  $entries += [PSCustomObject]@{
    Raw = $line
    Path = $path
    IsDeferred = $false
    IsIncluded = $false
  }
}

foreach ($entry in $entries) {
  foreach ($prefix in $deferPrefixes) {
    if ($entry.Path.StartsWith($prefix)) {
      $entry.IsDeferred = $true
      break
    }
  }
  if (-not $entry.IsDeferred) {
    foreach ($inc in $includePaths) {
      $incNorm = Normalize-Path($inc)
      if ($entry.Path -eq $incNorm -or $entry.Path.StartsWith("$incNorm/")) {
        $entry.IsIncluded = $true
        break
      }
    }
  }
}

$keep = $entries | Where-Object { $_.IsIncluded -and -not $_.IsDeferred }
$defer = $entries | Where-Object { $_.IsDeferred }
$unclassified = $entries | Where-Object { -not $_.IsDeferred -and -not $_.IsIncluded }

Write-Host "[scope] Keep candidates: $($keep.Count)" -ForegroundColor Green
Write-Host "[scope] Defer candidates: $($defer.Count)" -ForegroundColor Yellow
Write-Host "[scope] Unclassified candidates: $($unclassified.Count)" -ForegroundColor $(if ($unclassified.Count -eq 0) { "Green" } else { "Red" })

if ($defer.Count -gt 0) {
  Write-Host "`n[scope] Deferred sample:" -ForegroundColor Yellow
  $defer | Select-Object -First 20 | ForEach-Object { Write-Host " - $($_.Path)" }
}

if ($unclassified.Count -gt 0) {
  Write-Host "`n[scope] Unclassified paths (apply is blocked):" -ForegroundColor Red
  $unclassified | ForEach-Object { Write-Host " - $($_.Path)" }
}

if (-not $Apply) {
  Write-Host "`nPreview only. Re-run with -Apply to stage keep scope." -ForegroundColor Cyan
  exit 0
}

if ($unclassified.Count -gt 0) {
  throw "Release scope contains unclassified paths. Update the policy after review before staging."
}

$keepPaths = @($keep | ForEach-Object { $_.Path })
if ($keepPaths.Count -eq 0) {
  throw "Release scope is empty; refusing to stage."
}
git add -- @keepPaths
if ($LASTEXITCODE -ne 0) {
  throw "git add failed; release scope was not prepared."
}

Write-Host "[scope] Staged keep paths." -ForegroundColor Green
Write-Host "[scope] Next: git diff --staged --name-only" -ForegroundColor Cyan
Write-Host "[scope] Explicitly deferred paths remain untouched and must not be stashed automatically." -ForegroundColor Cyan
