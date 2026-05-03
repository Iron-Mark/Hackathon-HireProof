import { mkdir, writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'
import path from 'node:path'

const ICON_DIR = path.join(process.cwd(), 'extension', 'icons')
const SIZES = [16, 32, 48, 128, 512]

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax
  const vy = by - ay
  const wx = px - ax
  const wy = py - ay
  const lengthSquared = vx * vx + vy * vy
  const t = Math.max(0, Math.min(1, lengthSquared ? (wx * vx + wy * vy) / lengthSquared : 0))
  const dx = px - (ax + t * vx)
  const dy = py - (ay + t * vy)
  return Math.sqrt(dx * dx + dy * dy)
}

function rgbaForPixel(x, y, size) {
  const green = [85, 240, 111, 255]
  const dark = [4, 28, 20, 255]
  const white = [255, 255, 255, 255]
  const transparent = [0, 0, 0, 0]
  const u = (x + 0.5) / size
  const v = (y + 0.5) / size

  const shield = [
    [0.5, 0.05],
    [0.86, 0.18],
    [0.92, 0.55],
    [0.5, 0.96],
    [0.08, 0.55],
    [0.14, 0.18],
  ]

  let inside = false
  for (let i = 0, j = shield.length - 1; i < shield.length; j = i++) {
    const xi = shield[i][0]
    const yi = shield[i][1]
    const xj = shield[j][0]
    const yj = shield[j][1]
    const intersects = ((yi > v) !== (yj > v)) && (u < ((xj - xi) * (v - yi)) / (yj - yi) + xi)
    if (intersects) inside = !inside
  }
  if (!inside) return transparent

  let edgeDistance = Infinity
  for (let i = 0; i < shield.length; i += 1) {
    const a = shield[i]
    const b = shield[(i + 1) % shield.length]
    edgeDistance = Math.min(edgeDistance, distanceToSegment(u, v, a[0], a[1], b[0], b[1]))
  }
  if (edgeDistance <= 0.055) return green

  if (size >= 48) {
    const face = u >= 0.27 && u <= 0.73 && v >= 0.24 && v <= 0.43
    const faceBorder = face && (u <= 0.31 || u >= 0.69 || v <= 0.28 || v >= 0.39)
    const leftEye = Math.hypot(u - 0.41, v - 0.34) <= 0.028
    const rightEye = Math.hypot(u - 0.59, v - 0.34) <= 0.028
    if (leftEye || rightEye) return green
    if (faceBorder) return white
    if (face) return [2, 13, 10, 255]
  }

  const hLeft = u >= 0.20 && u <= 0.31 && v >= 0.48 && v <= 0.83
  const hRight = u >= 0.43 && u <= 0.54 && v >= 0.48 && v <= 0.83
  const hMiddle = u >= 0.20 && u <= 0.54 && v >= 0.62 && v <= 0.70
  if (hLeft || hRight || hMiddle) return white

  const pStem = u >= 0.60 && u <= 0.71 && v >= 0.48 && v <= 0.86
  const pTop = u >= 0.60 && u <= 0.84 && v >= 0.48 && v <= 0.58
  const pRight = u >= 0.78 && u <= 0.89 && v >= 0.54 && v <= 0.68
  const pMid = u >= 0.60 && u <= 0.84 && v >= 0.64 && v <= 0.73
  const pShape = pStem || pTop || pRight || pMid
  const checkDistance = Math.min(
    distanceToSegment(u, v, 0.66, 0.68, 0.73, 0.76),
    distanceToSegment(u, v, 0.73, 0.76, 0.88, 0.59),
  )
  if (pShape && checkDistance <= 0.035) return dark
  if (pShape) return green

  return dark
}

function png(size) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const raw = Buffer.alloc((size * 4 + 1) * size)
  let offset = 0
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0
    offset += 1
    for (let x = 0; x < size; x += 1) {
      const rgba = rgbaForPixel(x, y, size)
      raw[offset++] = rgba[0]
      raw[offset++] = rgba[1]
      raw[offset++] = rgba[2]
      raw[offset++] = rgba[3]
    }
  }

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

await mkdir(ICON_DIR, { recursive: true })
for (const size of SIZES) {
  await writeFile(path.join(ICON_DIR, `icon${size}.png`), png(size))
}

console.log(`Generated Chrome extension PNG icons: ${SIZES.map((size) => `icon${size}.png`).join(', ')}`)
