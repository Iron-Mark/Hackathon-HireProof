# HireProof — Interactive Cursor secrets setup for Vercel (Preview + Production)
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
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$DefaultRepoUrl = "https://github.com/Iron-Mark/Hackathon-HireProof"
$Environments = @("preview", "production")

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
        # ignore — use fallback
    }
    return $Fallback
}

function New-CursorWebhookSecret {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $hex = & node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>$null
        if ($hex -and ($hex = $hex.Trim())) {
            return $hex
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
    $whoami = & vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel CLI not authenticated. Run: vercel login"
    }
    Write-Host "Vercel CLI: logged in as $whoami" -ForegroundColor DarkGray
}

function Add-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string[]]$Targets
    )
    foreach ($target in $Targets) {
        if ($DryRun) {
            Write-Host "[DryRun] Would add $Name -> $target" -ForegroundColor Yellow
            continue
        }
        Write-Host "Adding $Name to $target..." -ForegroundColor Cyan
        $Value | & vercel env add $Name $target
        if ($LASTEXITCODE -ne 0) {
            throw "vercel env add failed for $Name ($target) with exit code $LASTEXITCODE"
        }
    }
}

Write-Host @"

=== HireProof Cursor secrets -> Vercel ===
Targets: preview, production (each variable)
Secrets are sent to Vercel only — not written to disk in this repo.

"@ -ForegroundColor White

if ($DryRun) {
    Write-Host "DRY RUN: no vercel env add commands will run.`n" -ForegroundColor Yellow
}

Test-VercelCliReady

$AllowedRepoUrl = Get-AllowedRepoUrlFromGit -Fallback $DefaultRepoUrl
$ModelId = "composer-2"
$RuntimeDefault = "cloud"
$MaxConcurrentRuns = "2"
$WebhookSecret = New-CursorWebhookSecret

Write-Host "Detected repo URL: $AllowedRepoUrl" -ForegroundColor DarkGray
Write-Host "Generated CURSOR_WEBHOOK_SECRET (32-byte hex, not shown)." -ForegroundColor DarkGray
Write-Host ""

$secureKey = Read-Host "Paste CURSOR_API_KEY (Cloud Agents API key)" -AsSecureString
$CursorApiKey = ConvertFrom-SecureStringPlain -Secure $secureKey
$secureKey = $null

$confirm = Read-Host "Proceed to set Preview + Production env vars on linked Vercel project? [y/N]"
if ($confirm -notmatch '^[yY]') {
    Write-Host "Cancelled. No changes made." -ForegroundColor Yellow
    exit 0
}

# Order: config first, secrets, feature flag last (Preview + Production together per task spec)
Add-VercelEnv -Name "CURSOR_ALLOWED_REPO_URL" -Value $AllowedRepoUrl -Targets $Environments
Add-VercelEnv -Name "CURSOR_MODEL_ID" -Value $ModelId -Targets $Environments
Add-VercelEnv -Name "CURSOR_RUNTIME_DEFAULT" -Value $RuntimeDefault -Targets $Environments
Add-VercelEnv -Name "CURSOR_MAX_CONCURRENT_RUNS" -Value $MaxConcurrentRuns -Targets $Environments
Add-VercelEnv -Name "CURSOR_API_KEY" -Value $CursorApiKey -Targets $Environments
Add-VercelEnv -Name "CURSOR_WEBHOOK_SECRET" -Value $WebhookSecret -Targets $Environments
Add-VercelEnv -Name "CURSOR_INTEGRATION_ENABLED" -Value "true" -Targets $Environments

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
  CURSOR_WEBHOOK_SECRET   = (encrypted in Vercel — copy from Dashboard if schedulers need it)
  CURSOR_INTEGRATION_ENABLED = true

Next steps:
  1. Redeploy Preview (and Production when ready) so serverless functions pick up env changes.
  2. Run smoke: node scripts/cursor-smoke.mjs (Preview / .env.local).
  3. Cron jobs: use header x-cursor-job-secret with the same webhook secret — see docs/cursor/automation.md

Runbook: $deployDoc
Verify names: vercel env ls

"@ -ForegroundColor Green

if ($DryRun) {
    Write-Host "Dry run complete — re-run without -DryRun after you have a real API key." -ForegroundColor Yellow
}
