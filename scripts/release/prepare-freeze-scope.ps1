param(
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$includePaths = @(
  ".github/workflows/frontend.yml",
  ".gitignore",
  "app",
  "components",
  "lib",
  "locales",
  "mappers",
  "services",
  "scripts",
  "types",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "prisma.config.ts",
  "docs/finalization"
)

$deferPrefixes = @(
  "tmp/",
  "storage/",
  "templates_docs/",
  "docs/new-to-test/",
  ".codex/skills/ui-ux-pro-max/"
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
$defer = $entries | Where-Object { $_.IsDeferred -or -not $_.IsIncluded }

Write-Host "[scope] Keep candidates: $($keep.Count)" -ForegroundColor Green
Write-Host "[scope] Defer candidates: $($defer.Count)" -ForegroundColor Yellow

if ($defer.Count -gt 0) {
  Write-Host "`n[scope] Deferred sample:" -ForegroundColor Yellow
  $defer | Select-Object -First 20 | ForEach-Object { Write-Host " - $($_.Path)" }
}

if (-not $Apply) {
  Write-Host "`nPreview only. Re-run with -Apply to stage keep scope." -ForegroundColor Cyan
  exit 0
}

git add -- ".github/workflows/frontend.yml" ".gitignore" "app" "components" "lib" "locales" "mappers" "services" "scripts" "types" "package.json" "next.config.ts" "tsconfig.json" "prisma.config.ts" "docs/finalization"

Write-Host "[scope] Staged keep paths." -ForegroundColor Green
Write-Host "[scope] Next: git diff --staged --name-only" -ForegroundColor Cyan
Write-Host "[scope] Then stash deferred leftovers if needed:" -ForegroundColor Cyan
Write-Host "  git stash push -u -m `"defer non-release artifacts before v1.0.0 freeze`"" -ForegroundColor Cyan
