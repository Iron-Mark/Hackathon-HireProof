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
  const readResult = await readStdinWithTimeout()
  const input = readResult.input

  if (readResult.timedOut || readResult.error || evaluateCursorPretoolInput(input)) {
    emitDecision({
      permission: 'deny',
      user_message: 'Blocked dangerous agent action.',
      agent_message: readResult.timedOut || readResult.error
        ? 'Pretool guard could not read the complete shell request; retry with complete hook input.'
        : 'Use preview environments and non-destructive commands only.',
    })
    return
  }

  emitDecision({
    permission: 'allow',
    agent_message: 'Command allowed by HireProof Cursor pretool guard.',
  })
}

function readStdinWithTimeout() {
  if (process.stdin.isTTY) return Promise.resolve({ input: '', complete: true })

  const configuredTimeoutMs = Number(process.env.CURSOR_PRETOOL_STDIN_TIMEOUT_MS || 250)
  const timeoutMs = Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : 250

  return new Promise((resolve) => {
    let input = ''
    let settled = false
    const finish = (status) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      process.stdin.off('data', onData)
      process.stdin.off('end', onEnd)
      process.stdin.off('error', onError)
      process.stdin.pause()
      resolve({ input, ...status })
    }
    const onData = (chunk) => {
      input += chunk
    }
    const onEnd = () => finish({ complete: true })
    const onError = () => finish({ error: true })
    const timer = setTimeout(() => finish({ timedOut: true }), timeoutMs)

    process.stdin.setEncoding('utf8')
    process.stdin.on('data', onData)
    process.stdin.on('end', onEnd)
    process.stdin.on('error', onError)
    process.stdin.resume()
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
