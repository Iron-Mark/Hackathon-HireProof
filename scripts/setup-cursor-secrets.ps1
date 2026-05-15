# HireProof - Interactive Cursor secrets setup for Vercel (Preview + Production)
# Requires: Vercel CLI logged in (`vercel whoami`), repo linked (`vercel link`).
# NEVER commits or writes secrets to repo files.
#
# Usage (from repo root):
#   .\scripts\setup-cursor-secrets.ps1
#   .\scripts\setup-cursor-secrets.ps1 -DryRun
#
# Docs: docs/cursor/deploy.md

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$CursorApiKeyPlain
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$DefaultRepoUrl = "https://github.com/Iron-Mark/Hackathon-HireProof"
$Environments = @("preview", "production")
$SensitiveEnvNames = @(
    "CURSOR_API_KEY",
    "CURSOR_WEBHOOK_SECRET"
)

function Get-AllowedRepoUrlFromGit {
    param([string]$Fallback)
    try {
        $remote = & git remote get-url origin 2>$null
        if (-not $remote) { return $Fallback }
        if ($remote -match '^git@github\.com:(.+?)(?:\.git)?$') {
            return "https://github.com/$($Matches[1])"
        }
        if ($remote -match '^https://github\.com/(.+?)(?:\.git)?$') {
            return "https://github.com/$($Matches[1])"
        }
    }
    catch {
        # ignore - use fallback
    }
    return $Fallback
}

function New-CursorWebhookSecret {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $hex = & node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>$null
        if ($hex) {
            $hex = $hex.Trim()
            if ($hex) {
                return $hex
            }
        }
    }
    $bytes = [byte[]]::new(32)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

function ConvertFrom-SecureStringPlain {
    param([System.Security.SecureString]$Secure)
    if (-not $Secure -or $Secure.Length -eq 0) {
        throw "API key cannot be empty."
    }
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

function Test-VercelCliReady {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        throw "Vercel CLI not found. Install: npm i -g vercel, then run 'vercel login' and 'vercel link' from the repo root."
    }
    $whoamiLines = @(& vercel whoami 2>&1)
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        $detail = ($whoamiLines | Out-String).Trim()
        if ($detail) {
            throw "Vercel CLI not authenticated (exit ${exitCode}): $detail`nRun: vercel login"
        }
        throw "Vercel CLI not authenticated (exit $exitCode). Run: vercel login"
    }
    $whoami = ($whoamiLines | Select-Object -Last 1).ToString().Trim()
    Write-Host "Vercel CLI: logged in as $whoami" -ForegroundColor DarkGray
}

function Invoke-VercelEnvAdd {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Target,
        [switch]$Sensitive
    )

    $trimmedValue = if ($null -eq $Value) { "" } else { $Value.Trim() }
    if (-not $trimmedValue) {
        throw "Value for $Name is empty after trim."
    }

    $vercelArgs = @(
        "env", "add", $Name, $Target,
        "--value", $trimmedValue,
        "--yes",
        "--force"
    )
    if ($Sensitive) {
        $vercelArgs += "--sensitive"
    }

    $output = @(& vercel @vercelArgs 2>&1)
    $exitCode = $LASTEXITCODE
    if ($output) {
        $output | ForEach-Object { Write-Host $_ }
    }
    if ($exitCode -ne 0) {
        $detail = ($output | Out-String).Trim()
        if ($detail) {
            throw "vercel env add failed for $Name ($Target) with exit code ${exitCode}: $detail"
        }
        throw "vercel env add failed for $Name ($Target) with exit code $exitCode"
    }
}

function Add-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string[]]$Targets
    )

    $isSensitive = $SensitiveEnvNames -contains $Name
    foreach ($target in $Targets) {
        if ($DryRun) {
            Write-Host "[DryRun] Would add $Name -> $target" -ForegroundColor Yellow
            continue
        }
        Write-Host "Adding $Name to $target..." -ForegroundColor Cyan
        Invoke-VercelEnvAdd -Name $Name -Value $Value -Target $target -Sensitive:($isSensitive)
    }
}

function Set-VercelEnvVariable {
    param(
        [string]$Name,
        [string]$Value,
        [string[]]$Targets
    )

    try {
        Add-VercelEnv -Name $Name -Value $Value -Targets $Targets
    }
    catch {
        Write-Host "ERROR: Failed to set $Name on Vercel." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        throw
    }
}

Write-Host @"

=== HireProof Cursor secrets -> Vercel ===
Targets: preview, production (each variable)
Secrets are sent to Vercel only - not written to disk in this repo.

"@ -ForegroundColor White

if ($DryRun) {
    Write-Host "DRY RUN: no vercel env add commands will run." -ForegroundColor Yellow
    Write-Host ""
}

Test-VercelCliReady

$AllowedRepoUrl = (Get-AllowedRepoUrlFromGit -Fallback $DefaultRepoUrl).Trim()
$ModelId = "composer-2"
$RuntimeDefault = "cloud"
$MaxConcurrentRuns = "2"
$WebhookSecret = (New-CursorWebhookSecret).Trim()

Write-Host "Detected repo URL: $AllowedRepoUrl" -ForegroundColor DarkGray
Write-Host "Generated CURSOR_WEBHOOK_SECRET (32-byte hex, not shown)." -ForegroundColor DarkGray
Write-Host ""

if ($DryRun) {
    if ($CursorApiKeyPlain) {
        $CursorApiKey = $CursorApiKeyPlain.Trim()
    }
    else {
        $CursorApiKey = "dry-run-placeholder-key"
        Write-Host "[DryRun] Skipping CURSOR_API_KEY prompt (placeholder used)." -ForegroundColor Yellow
    }
}
elseif ($CursorApiKeyPlain) {
    $CursorApiKey = $CursorApiKeyPlain.Trim()
    if (-not $CursorApiKey) {
        throw "CURSOR_API_KEY parameter cannot be empty."
    }
}
else {
    $secureKey = Read-Host "Paste CURSOR_API_KEY (Cloud Agents API key)" -AsSecureString
    $CursorApiKey = (ConvertFrom-SecureStringPlain -Secure $secureKey).Trim()
    $secureKey = $null
}

if (-not $CursorApiKey) {
    throw "CURSOR_API_KEY cannot be empty."
}

if ($DryRun) {
    Write-Host "[DryRun] Skipping confirmation prompt (auto-proceed)." -ForegroundColor Yellow
}
else {
    $confirm = Read-Host "Proceed to set Preview + Production env vars on linked Vercel project? [y/N]"
    if ($confirm -notmatch '^[yY]') {
        Write-Host "Cancelled. No changes made." -ForegroundColor Yellow
        exit 0
    }
}

# Order: config first, secrets, feature flag last (Preview + Production together per task spec)
$envVars = @(
    @{ Name = "CURSOR_ALLOWED_REPO_URL"; Value = $AllowedRepoUrl },
    @{ Name = "CURSOR_MODEL_ID"; Value = $ModelId },
    @{ Name = "CURSOR_RUNTIME_DEFAULT"; Value = $RuntimeDefault },
    @{ Name = "CURSOR_MAX_CONCURRENT_RUNS"; Value = $MaxConcurrentRuns },
    @{ Name = "CURSOR_API_KEY"; Value = $CursorApiKey },
    @{ Name = "CURSOR_WEBHOOK_SECRET"; Value = $WebhookSecret },
    @{ Name = "CURSOR_INTEGRATION_ENABLED"; Value = "true" }
)

foreach ($entry in $envVars) {
    Set-VercelEnvVariable -Name $entry.Name -Value $entry.Value -Targets $Environments
}

$CursorApiKey = $null
$WebhookSecret = $null

$deployDoc = Join-Path $RepoRoot "docs\cursor\deploy.md"
Write-Host @"

=== Summary ===
Set on preview + production:
  CURSOR_ALLOWED_REPO_URL = $AllowedRepoUrl
  CURSOR_MODEL_ID         = $ModelId
  CURSOR_RUNTIME_DEFAULT  = $RuntimeDefault
  CURSOR_MAX_CONCURRENT_RUNS = $MaxConcurrentRuns
  CURSOR_API_KEY          = (encrypted in Vercel)
  CURSOR_WEBHOOK_SECRET   = (encrypted in Vercel - copy from Dashboard if schedulers need it)
  CURSOR_INTEGRATION_ENABLED = true

Next steps:
  1. Redeploy Preview (and Production when ready) so serverless functions pick up env changes.
  2. Run smoke: node scripts/cursor-smoke.mjs (Preview / .env.local).
  3. Cron jobs: use header x-cursor-job-secret with the same webhook secret - see docs/cursor/automation.md

Runbook: $deployDoc
Verify names: vercel env ls

"@ -ForegroundColor Green

if ($DryRun) {
    Write-Host "Dry run complete - re-run without -DryRun after you have a real API key." -ForegroundColor Yellow
}
