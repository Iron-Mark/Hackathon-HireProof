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
  const input = await readStdinWithTimeout()

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

function readStdinWithTimeout() {
  if (process.stdin.isTTY) return Promise.resolve('')

  const timeoutMs = Number(process.env.CURSOR_PRETOOL_STDIN_TIMEOUT_MS || 250)

  return new Promise((resolve) => {
    let input = ''
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(input)
    }
    const timer = setTimeout(finish, timeoutMs)

    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      input += chunk
    })
    process.stdin.on('end', finish)
    process.stdin.on('error', finish)
    process.stdin.resume()
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
