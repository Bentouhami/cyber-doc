param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [switch]$AllowEpermSkip
)

$ErrorActionPreference = "Stop"

$env:SMOKE_BASE_URL = $BaseUrl
if ($AllowEpermSkip) {
  $env:SMOKE_ALLOW_EPERM_SKIP = "1"
}

Write-Host "[release] Post-deploy critical smoke on $BaseUrl" -ForegroundColor Cyan
npm run release:smoke:critical

Write-Host "[release] Post-deploy smoke completed." -ForegroundColor Green
