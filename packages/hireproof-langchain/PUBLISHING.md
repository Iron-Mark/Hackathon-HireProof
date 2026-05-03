# LangChain Package Publishing Record

Package name: `@hireproof/langchain`

Current status: published on npm as `@hireproof/langchain@1.0.0`.

Package URL: `https://www.npmjs.com/package/@hireproof/langchain`

Registry tarball: `https://registry.npmjs.org/@hireproof/langchain/-/langchain-1.0.0.tgz`

Pre-publish checks used:

1. Run from the repo root:

```powershell
pnpm integrations:test
node packages/hireproof-langchain/test-smoke.mjs
```

2. Pack locally:

```powershell
npm pack --workspace @hireproof/langchain
```

3. Install the tarball into a clean sample project with `@langchain/core` and `zod`.
4. Import `createHireProofAuditTool`.
5. Run the demo API request and confirm a High-Risk fixture result.
6. Publish only from the npm account that should own the package scope.
7. Add the npm package URL to public docs after publish succeeds.

Dry-run command:

```powershell
npm pack --workspace @hireproof/langchain --dry-run
```

Publish command used after account ownership is confirmed:

```powershell
npm login
npm publish --workspace @hireproof/langchain --access public
```
