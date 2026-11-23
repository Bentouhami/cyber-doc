param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [switch]$AllowEpermSkip,
  [switch]$ValidateOnly
)

$ErrorActionPreference = "Stop"

$parsedBaseUrl = $null
if (-not [Uri]::TryCreate($BaseUrl, [UriKind]::Absolute, [ref]$parsedBaseUrl)) {
  throw "BaseUrl must be an absolute HTTP(S) origin."
}

if ($parsedBaseUrl.Scheme -notin @("http", "https")) {
  throw "BaseUrl must use HTTP or HTTPS."
}

if (
  $parsedBaseUrl.UserInfo -or
  $parsedBaseUrl.Query -or
  $parsedBaseUrl.Fragment -or
  $parsedBaseUrl.AbsolutePath -ne "/"
) {
  throw "BaseUrl must be an origin without credentials, path, query or fragment."
}

if (-not $parsedBaseUrl.IsLoopback -and $parsedBaseUrl.Scheme -ne "https") {
  throw "A non-loopback post-deploy smoke target must use HTTPS."
}

$normalizedBaseUrl = $parsedBaseUrl.GetLeftPart([UriPartial]::Authority)
if ($ValidateOnly) {
  Write-Output $normalizedBaseUrl
  exit 0
}

Write-Host "[release] Checking readiness on $normalizedBaseUrl" -ForegroundColor Cyan
$health = Invoke-RestMethod `
  -Uri "$normalizedBaseUrl/api/health" `
  -Method Get `
  -MaximumRedirection 0 `
  -TimeoutSec 15
if ($health.status -ne "ok") {
  throw "Target readiness did not return status 'ok'."
}

$env:SMOKE_BASE_URL = $normalizedBaseUrl
if ($AllowEpermSkip) {
  $env:SMOKE_ALLOW_EPERM_SKIP = "1"
}

Write-Host "[release] Post-deploy critical smoke on $normalizedBaseUrl" -ForegroundColor Cyan
pnpm run release:smoke:critical

Write-Host "[release] Post-deploy smoke completed." -ForegroundColor Green
