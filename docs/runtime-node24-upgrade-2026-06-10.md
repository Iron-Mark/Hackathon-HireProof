# Node 24 Runtime Upgrade Proof - 2026-06-10

This note records the Node 20 to Node 24 readiness audit for HireProof.

## Source Of Truth

- Vercel docs list 24.x, 22.x, and 20.x as available Node.js versions, with 24.x as the default for new projects.
- Vercel docs state that `package.json` `engines.node = "24.x"` overrides the dashboard project setting for deployments.

## Local Runtime Used

The machine did not have a Node 24 version manager installed, so the audit used the npm-distributed Node binary:

```powershell
npx -y -p node@24 node -v
```

Verified runtime:

```text
v24.16.0
```

## Verification

Commands run under Node 24:

```powershell
npx -y -p node@24 -p npm@11 npm ci
npx -y -p node@24 -p npm@11 npm audit --audit-level=moderate
npx -y -p node@24 -p npm@11 npm run lint
npx -y -p node@24 -p npm@11 npm exec -- node --test test/runtime-wiring.test.mjs test/postbuild-node-compat.test.mjs test/cursor-routes.test.mjs
npx -y -p node@24 -p npm@11 npm run build
```

Results:

- `npm ci`: passed.
- `npm audit --audit-level=moderate`: passed after adding narrow transitive overrides for `axios@1.17.0` and `hono@4.12.25`.
- `npm run lint`: passed.
- Targeted Node regression tests: passed, 75 tests.
- `npm run build`: passed with Next.js 16.2.6 and postbuild SWC middleware trace patch.

## Changes Made

- `package.json` and `package-lock.json` root engine pin changed to `24.x`.
- `.node-version` changed to `24`.
- GitHub Actions Node setup changed to `24`.
- Docker and Cursor agent Docker base images changed to `node:24-alpine`.
- Deployment docs updated to Node 24.x and Next.js 16.2.6.
- Transitive security overrides were tightened for `axios` and `hono`; these are pulled in through Slack and MCP dependencies.

## Follow-Up

Vercel project settings were also updated from Node.js Version `20.x` to `24.x` after the local verification passed. The next deployment should build with Node 24.x from both the dashboard setting and `package.json` engine pin. After deployment, verify with build logs or a temporary build command that prints `node -v`.
