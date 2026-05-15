import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

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

function emitDecision(decision) {
  console.log(JSON.stringify(decision))
}

async function main() {
  const input = (() => {
    try {
      return readFileSync(0, 'utf8')
    } catch {
      return ''
    }
  })()

  if (evaluateCursorPretoolInput(input)) {
    emitDecision({
      permission: 'deny',
      user_message: 'Blocked dangerous agent action.',
      agent_message: 'Use preview environments and non-destructive commands only.',
    })
    return
  }

  emitDecision({
    permission: 'allow',
    agent_message: 'Command allowed by HireProof Cursor pretool guard.',
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
