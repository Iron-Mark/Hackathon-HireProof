import { mkdir, rm, readFile, readdir, stat, copyFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const sourceDir = path.join(root, 'extension')
const outDir = path.join(root, 'dist', 'chrome')
const packageDir = path.join(outDir, 'hireproof-extension')
const zipPath = path.join(outDir, 'hireproof-extension.zip')
const publicDownloadsDir = path.join(root, 'public', 'downloads')
const publicZipPath = path.join(publicDownloadsDir, 'hireproof-extension.zip')
const requiredIcons = ['16', '32', '48', '128', '512']
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js',
  'styles.css',
]

const blocklist = new Set(['.env', '.env.local', 'node_modules', '.git', 'dist'])

async function ensureIcons() {
  const missing = requiredIcons.some((size) => !existsSync(path.join(sourceDir, 'icons', `icon${size}.png`)))
  if (missing) {
    await execFileAsync(process.execPath, [path.join(root, 'scripts', 'generate-extension-icons.mjs')], { cwd: root })
  }
}

async function validateManifest() {
  const manifest = JSON.parse(await readFile(path.join(sourceDir, 'manifest.json'), 'utf8'))
  if (manifest.manifest_version !== 3) throw new Error('Chrome extension must use Manifest V3.')
  for (const file of requiredFiles) {
    if (!existsSync(path.join(sourceDir, file))) throw new Error(`Missing extension file: ${file}`)
  }
  for (const size of requiredIcons) {
    const declared = manifest.icons?.[size]
    if (declared !== `icons/icon${size}.png`) throw new Error(`Manifest icon ${size} must point to icons/icon${size}.png`)
    if (!existsSync(path.join(sourceDir, declared))) throw new Error(`Missing icon file: ${declared}`)
  }
  if (manifest.permissions?.includes('tabs')) throw new Error('Extension should not request broad tabs permission.')
  if (!manifest.action?.default_popup) throw new Error('Extension action popup is required.')
}

async function copyTree(from, to) {
  await mkdir(to, { recursive: true })
  for (const item of await readdir(from)) {
    if (blocklist.has(item) || item.endsWith('.map') || item.endsWith('.md') || item.endsWith('.svg')) continue
    const source = path.join(from, item)
    const target = path.join(to, item)
    const itemStat = await stat(source)
    if (itemStat.isDirectory()) {
      await copyTree(source, target)
    } else {
      await copyFile(source, target)
    }
  }
}

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

async function listFiles(dir, base = dir) {
  const files = []
  for (const item of await readdir(dir)) {
    const fullPath = path.join(dir, item)
    const itemStat = await stat(fullPath)
    if (itemStat.isDirectory()) {
      files.push(...await listFiles(fullPath, base))
    } else {
      files.push(path.relative(base, fullPath).replaceAll(path.sep, '/'))
    }
  }
  return files.sort()
}

function writeZipNumber(buffer, value, offset, bytes) {
  if (bytes === 2) buffer.writeUInt16LE(value, offset)
  else buffer.writeUInt32LE(value >>> 0, offset)
}

async function makeZip(dir, target) {
  const files = await listFiles(dir)
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file)
    const data = await readFile(path.join(dir, file))
    const checksum = crc32(data)

    const local = Buffer.alloc(30)
    writeZipNumber(local, 0x04034b50, 0, 4)
    writeZipNumber(local, 20, 4, 2)
    writeZipNumber(local, 0, 6, 2)
    writeZipNumber(local, 0, 8, 2)
    writeZipNumber(local, checksum, 14, 4)
    writeZipNumber(local, data.length, 18, 4)
    writeZipNumber(local, data.length, 22, 4)
    writeZipNumber(local, name.length, 26, 2)
    localParts.push(local, name, data)

    const central = Buffer.alloc(46)
    writeZipNumber(central, 0x02014b50, 0, 4)
    writeZipNumber(central, 20, 4, 2)
    writeZipNumber(central, 20, 6, 2)
    writeZipNumber(central, 0, 8, 2)
    writeZipNumber(central, 0, 10, 2)
    writeZipNumber(central, checksum, 16, 4)
    writeZipNumber(central, data.length, 20, 4)
    writeZipNumber(central, data.length, 24, 4)
    writeZipNumber(central, name.length, 28, 2)
    writeZipNumber(central, offset, 42, 4)
    centralParts.push(central, name)

    offset += local.length + name.length + data.length
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const footer = Buffer.alloc(22)
  writeZipNumber(footer, 0x06054b50, 0, 4)
  writeZipNumber(footer, files.length, 8, 2)
  writeZipNumber(footer, files.length, 10, 2)
  writeZipNumber(footer, centralSize, 12, 4)
  writeZipNumber(footer, offset, 16, 4)

  await writeFile(target, Buffer.concat([...localParts, ...centralParts, footer]))
  return files
}

await ensureIcons()
await validateManifest()
await rm(packageDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })
await copyTree(sourceDir, packageDir)
const files = await makeZip(packageDir, zipPath)
await mkdir(publicDownloadsDir, { recursive: true })
await copyFile(zipPath, publicZipPath)

console.log(`Created ${path.relative(root, zipPath)} with ${files.length} files.`)
console.log(`Published ${path.relative(root, publicZipPath)} for public download.`)
