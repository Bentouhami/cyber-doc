param(
  [string]$SmokeBaseUrl = "http://127.0.0.1:3000",
  [switch]$AllowEpermSkip,
  [switch]$ConfirmDisposableDatabase
)

$ErrorActionPreference = "Stop"

Write-Host "[release] Running preflight gates..." -ForegroundColor Cyan
pnpm run release:preflight

if ($AllowEpermSkip) {
  $env:SMOKE_ALLOW_EPERM_SKIP = "1"
}
$env:SMOKE_BASE_URL = $SmokeBaseUrl
if (-not $ConfirmDisposableDatabase) {
  throw "Critical smoke mutates data. Pass -ConfirmDisposableDatabase only for a disposable database."
}
$env:SMOKE_DISPOSABLE_DATABASE = "1"

Write-Host "[release] Running critical smoke..." -ForegroundColor Cyan
pnpm run release:smoke:critical

Write-Host "[release] Release preparation completed." -ForegroundColor Green
