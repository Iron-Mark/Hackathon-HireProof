import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_DERIVATION_SALT = 'hireproof-byok-encryption-v2'

function deriveKey(secret) {
  const raw = String(secret || '').trim()
  if (!raw) throw new Error('BYOK encryption key is required.')
  return crypto.scryptSync(raw, KEY_DERIVATION_SALT, 32)
}

export function encryptSecret(secret, encryptionKey) {
  const iv = crypto.randomBytes(12)
  const key = deriveKey(encryptionKey)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()])

  return {
    algorithm: ALGORITHM,
    iv: iv.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
  }
}

export function decryptSecret(payload, encryptionKey) {
  if (!payload || payload.algorithm !== ALGORITHM) throw new Error('Unsupported encrypted payload.')
  const key = deriveKey(encryptionKey)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function redactSecret(secret) {
  const value = String(secret || '')
  return { lastFour: value.slice(-4) }
}
