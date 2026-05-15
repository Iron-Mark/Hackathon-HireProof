import fs from 'node:fs/promises'

const blocked = [
  /rm\s+-rf\s+\//i,
  /rm\s+-rf\s+\.\//i,
  /vercel\s+env/i,
  /redis-cli/i,
  /curl\s+.*hireproof\.tech\/api\/workflows/i,
  /curl\s+.*hireproof\.tech\/api\/webhooks/i,
]

export function evaluateCursorPretoolInput(input) {
  return blocked.some((rule) => rule.test(input))
}

const input = await fs.readFile(0, 'utf8').catch(() => '')

if (evaluateCursorPretoolInput(input)) {
  console.error('Blocked dangerous agent action. Use preview environments and non-destructive commands only.')
  process.exit(1)
}

process.exit(0)
