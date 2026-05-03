# Automation Marketplace Submission Runbook

Last checked: 2026-05-04

This runbook turns the repo-shipped automation packs into external marketplace submissions. Do not mark any marketplace as live until the matching account-backed submission and approval evidence exists.

Npm publication status as of 2026-05-04:

- Published: `@hireproof/cli@1.0.0`
- Published: `@hireproof/langchain@1.0.0`
- Published: `hireproof-sdk@1.0.0`
- Published: `n8n-nodes-hireproof@1.0.0`

Make Custom App review and any n8n directory/community verification remain separate external review steps.

## Prerequisites

- Production URL verified: `https://hireproof-sigma.vercel.app`
- Demo API key verified: `hireproof_agent_demo_key`
- Source bundle generated: `public/downloads/hireproof-native-integrations.zip`
- Validation passed:

```powershell
pnpm integrations:build
pnpm integrations:test
pnpm integrations:package
pnpm lint
pnpm build
```

## n8n Community Node

Source: `integrations/n8n-nodes-hireproof`

Dry-run and packaging commands:

```powershell
pnpm integrations:build
node integrations\n8n-nodes-hireproof\test\request.test.mjs
npm pack .\integrations\n8n-nodes-hireproof --dry-run
npm pack .\integrations\n8n-nodes-hireproof
npm view n8n-nodes-hireproof version
```

Local install options:

```powershell
# Option A: install the packed tarball into your n8n custom extensions path.
npm install C:\path\to\n8n-nodes-hireproof-1.0.0.tgz

# Option B: install from the source folder while iterating locally.
npm install C:\Codes Local\Hackathons (Workspace)\v0-to-Agent\integrations\n8n-nodes-hireproof
```

Submission steps:

1. Build or pack from the source folder.
2. Install into a local n8n instance.
3. Add the `HireProof API` credential with the demo API key and production base URL.
4. Create one workflow with `HireProof > Run audit`.
5. Create one workflow with `HireProof > Run async audit` and a public callback URL.
6. Capture screenshots:
   - Node search result showing `HireProof`.
   - Credential form.
   - Run audit operation fields.
   - Successful execution output with `verdict`, `riskScore`, and `summary`.
   - Async `202 processing` response and callback receiver output.
7. Submit to n8n community-node review only after local install and screenshots are complete.

Current claim: npm package is published and source package is validated. n8n community/directory verification is still pending until local n8n screenshots and review evidence are captured.

## Make Custom App

Source: `integrations/make-hireproof`

Dry-run validation commands:

```powershell
pnpm integrations:build
Get-ChildItem integrations\make-hireproof -Recurse -Filter *.json | ForEach-Object {
  Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null
}
```

Make does not use an npm publish flow for this source pack. The submission happens inside the Make Custom Apps builder. Use the JSON files as the source of truth for metadata, connection, modules, and sample requests.

Submission steps:

1. Import or recreate the app from the source pack in Make's Custom Apps builder.
2. Configure API-key connection using `x-api-key`.
3. Add modules:
   - `Audit job post`
   - `Audit job post async`
   - `Get API health`
4. Run module tests with the demo API key.
5. Capture screenshots:
   - App metadata.
   - Connection setup.
   - Audit module input fields.
   - Successful audit output fields.
   - Async module response.
   - Health module response.
6. Submit to Make review after the module tests pass.

Current claim: source pack implemented and static-validated. Not yet approved by Make.

## LangChain Package

Source: `packages/hireproof-langchain`

Dry-run and publishing commands:

```powershell
node packages\hireproof-langchain\test-smoke.mjs
npm pack --workspace @hireproof/langchain --dry-run
npm pack --workspace @hireproof/langchain

npm view @hireproof/langchain version
```

Submission steps:

1. Run `node packages/hireproof-langchain/test-smoke.mjs`.
2. Test the example in `packages/hireproof-langchain/examples/basic-agent.mjs`.
3. Run `npm pack --workspace @hireproof/langchain` or pack from the package directory when validating a new release.
4. Install the npm package or packed tarball into a separate sample app.
5. Confirm `createHireProofAuditTool` can be imported and invoked.
6. Confirm the npm package page stays public.
7. Update `/docs/automations` after any version bump.

Current claim: package is published on npm and smoke-tested.

## ZIP Bundle Validation

Regenerate and validate the public source bundle:

```powershell
pnpm integrations:package

$tmp = Join-Path $env:TEMP ("hireproof-integrations-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
Expand-Archive -LiteralPath public\downloads\hireproof-native-integrations.zip -DestinationPath $tmp
Test-Path (Join-Path $tmp "integrations\n8n-nodes-hireproof\package.json")
Test-Path (Join-Path $tmp "integrations\make-hireproof\app.json")
Test-Path (Join-Path $tmp "packages\hireproof-langchain\package.json")
Remove-Item -LiteralPath $tmp -Recurse -Force
```

## Post-Submission Evidence

Save evidence under `docs/demo/` or a future `docs/evidence/` folder:

- Marketplace submission confirmation screenshots.
- Review status URLs.
- Published package/listing URLs.
- One working live execution screenshot per platform.

Only after that evidence exists should public copy say `marketplace submitted`, `under review`, or `published`.
