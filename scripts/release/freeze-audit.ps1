param(
  [string]$OutputDir = "tmp/release-freeze"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$statusLines = git status --porcelain
$branch = git branch --show-current

$modified = ($statusLines | Where-Object { $_ -match "^ M|^M " }).Count
$untracked = ($statusLines | Where-Object { $_ -match "^\?\?" }).Count
$deleted = ($statusLines | Where-Object { $_ -match "^ D|^D " }).Count
$renamed = ($statusLines | Where-Object { $_ -match "^R " }).Count

$isClean = ($modified -eq 0 -and $untracked -eq 0 -and $deleted -eq 0 -and $renamed -eq 0)

$report = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  branch = $branch
  isClean = $isClean
  counts = [ordered]@{
    modified = $modified
    untracked = $untracked
    deleted = $deleted
    renamed = $renamed
  }
  sample = $statusLines | Select-Object -First 50
}

$jsonPath = Join-Path $OutputDir "results.json"
$mdPath = Join-Path $OutputDir "results.md"

$report | ConvertTo-Json -Depth 6 | Out-File -FilePath $jsonPath -Encoding utf8

$md = @()
$md += "# Release Freeze Audit"
$md += ""
$md += "- Generated: $($report.generatedAt)"
$md += "- Branch: $branch"
$md += "- Clean: $isClean"
$md += ""
$md += "## Counts"
$md += ""
$md += "- Modified: $modified"
$md += "- Untracked: $untracked"
$md += "- Deleted: $deleted"
$md += "- Renamed: $renamed"
$md += ""
$md += "## Sample (first 50)"
$md += ""
foreach ($line in $report.sample) {
  $md += "- ``$line``"
}

$md -join "`n" | Out-File -FilePath $mdPath -Encoding utf8

if (-not $isClean) {
  Write-Host "[freeze-audit] Working tree is not clean." -ForegroundColor Yellow
  exit 1
}

Write-Host "[freeze-audit] Working tree is clean." -ForegroundColor Green
