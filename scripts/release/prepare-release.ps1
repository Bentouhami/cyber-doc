param(
  [string]$SmokeBaseUrl = "http://127.0.0.1:3000",
  [switch]$AllowEpermSkip
)

$ErrorActionPreference = "Stop"

Write-Host "[release] Running preflight gates..." -ForegroundColor Cyan
npm run release:preflight

if ($AllowEpermSkip) {
  $env:SMOKE_ALLOW_EPERM_SKIP = "1"
}
$env:SMOKE_BASE_URL = $SmokeBaseUrl

Write-Host "[release] Running critical smoke..." -ForegroundColor Cyan
npm run release:smoke:critical

Write-Host "[release] Release preparation completed." -ForegroundColor Green
