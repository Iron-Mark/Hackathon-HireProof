/**
 * Next.js middleware NFT traces @swc/helpers CJS but the proxy runtime
 * resolves ESM helpers. Patch middleware.js.nft.json after build.
 */
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')
const esmDir = path.join(repoRoot, 'node_modules', '@swc', 'helpers', 'esm')

if (!fs.existsSync(esmDir)) {
  console.warn('[patch-middleware-swc-trace] @swc/helpers/esm not found; skipping.')
  process.exit(0)
}

const esmFiles = fs
  .readdirSync(esmDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => `../../node_modules/@swc/helpers/esm/${name}`)

const nftPaths = [
  path.join(repoRoot, '.next', 'server', 'middleware.js.nft.json'),
  path.join(repoRoot, '.next', 'standalone', '.next', 'server', 'middleware.js.nft.json'),
]

let patched = 0
for (const nftPath of nftPaths) {
  if (!fs.existsSync(nftPath)) continue

  const nft = JSON.parse(fs.readFileSync(nftPath, 'utf8'))
  const files = new Set([...(nft.files || []), ...esmFiles])
  nft.files = [...files].sort()
  fs.writeFileSync(nftPath, JSON.stringify(nft))
  patched += 1
}

if (patched > 0) {
  console.log(
    `[patch-middleware-swc-trace] Added ${esmFiles.length} @swc/helpers/esm file(s) to ${patched} middleware NFT manifest(s).`,
  )
}
