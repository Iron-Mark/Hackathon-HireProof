# HireProof — Cursor integration Vercel env setup (non-interactive)
# Fill placeholders below, then run from repo root:
#   .\scripts\vercel-cursor-env-setup.ps1
#   .\scripts\vercel-cursor-env-setup.ps1 -DryRun
#
# Requires: Vercel CLI logged in (`vercel whoami`), repo linked (`vercel link`).
# NEVER commit real secrets. Do not paste API keys into chat or git.
#
# Interactive alternative: .\scripts\setup-cursor-secrets.ps1
# Docs: docs/cursor/deploy.md

[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

# --- Placeholders (replace before running) ---
$CursorApiKey        = "<PASTE_CURSOR_CLOUD_AGENTS_API_KEY>"
$CursorWebhookSecret = "<PASTE_32_BYTE_HEX_FROM_node_-e_crypto>"
$AllowedRepoUrl      = "https://github.com/Iron-Mark/Hackathon-HireProof"
$ModelId             = "composer-2"
$RuntimeDefault      = "cloud"
$MaxConcurrentRuns   = "2"

$Environments = @("preview", "production")

function Add-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string[]]$Targets
    )
    foreach ($env in $Targets) {
        if ($DryRun) {
            Write-Host "[DryRun] Would add $Name -> $env" -ForegroundColor Yellow
            continue
        }
        Write-Host "Adding $Name to $env..." -ForegroundColor Cyan
        $Value | vercel env add $Name $env
        if ($LASTEXITCODE -ne 0) {
            throw "vercel env add failed for $Name ($env)"
        }
    }
}

if ($CursorApiKey -like "<*>" -or $CursorWebhookSecret -like "<*>" ) {
    Write-Host "Fill placeholders at top of this script, or run: .\scripts\setup-cursor-secrets.ps1" -ForegroundColor Yellow
    exit 1
}

Add-VercelEnv -Name "CURSOR_ALLOWED_REPO_URL" -Value $AllowedRepoUrl -Targets $Environments
Add-VercelEnv -Name "CURSOR_MODEL_ID" -Value $ModelId -Targets $Environments
Add-VercelEnv -Name "CURSOR_RUNTIME_DEFAULT" -Value $RuntimeDefault -Targets $Environments
Add-VercelEnv -Name "CURSOR_MAX_CONCURRENT_RUNS" -Value $MaxConcurrentRuns -Targets $Environments
Add-VercelEnv -Name "CURSOR_API_KEY" -Value $CursorApiKey -Targets $Environments
Add-VercelEnv -Name "CURSOR_WEBHOOK_SECRET" -Value $CursorWebhookSecret -Targets $Environments
Add-VercelEnv -Name "CURSOR_INTEGRATION_ENABLED" -Value "true" -Targets $Environments

Write-Host "Done. Redeploy Preview, run cursor-smoke / developer panel QA, then Production." -ForegroundColor Green
Write-Host "Runbook: docs/cursor/deploy.md" -ForegroundColor DarkGray
