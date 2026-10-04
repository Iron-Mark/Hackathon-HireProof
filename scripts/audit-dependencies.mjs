import { spawnSync } from 'node:child_process'

const BLOCKED_SEVERITIES = new Set(['moderate', 'high', 'critical'])
const ACCEPTED_ADVISORIES = new Map([
  [
    'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',
    'The affected cache helper is only present in the unused @workflow/nest CLI download chain; HireProof uses workflow/next and does not execute the Nest adapter. Upstream has no patched release.',
  ],
])

const npmCli = process.env.npm_execpath
const args = npmCli
  ? [process.execPath, [npmCli, 'audit', '--omit=dev', '--json']]
  : ['npm', ['audit', '--omit=dev', '--json']]
const audit = spawnSync(args[0], args[1], { encoding: 'utf8', windowsHide: true })

if (!audit.stdout?.trim()) {
  console.error('npm audit did not return a JSON report.')
  if (audit.error) console.error(audit.error.message)
  if (audit.stderr?.trim()) console.error(audit.stderr.trim())
  process.exit(1)
}

let report
try {
  report = JSON.parse(audit.stdout)
} catch (error) {
  console.error('npm audit returned invalid JSON.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const vulnerabilities = report.vulnerabilities ?? {}
const acceptedCache = new Map()

function isAcceptedChain(name, visiting = new Set()) {
  if (acceptedCache.has(name)) return acceptedCache.get(name)
  if (visiting.has(name)) return false

  const vulnerability = vulnerabilities[name]
  if (!vulnerability || !BLOCKED_SEVERITIES.has(vulnerability.severity)) return false

  const nextVisiting = new Set(visiting).add(name)
  const blockingCauses = (vulnerability.via ?? []).filter((cause) =>
    typeof cause === 'string'
      ? BLOCKED_SEVERITIES.has(vulnerabilities[cause]?.severity)
      : BLOCKED_SEVERITIES.has(cause?.severity),
  )

  const accepted = blockingCauses.length > 0 && blockingCauses.every((cause) =>
    typeof cause === 'string'
      ? isAcceptedChain(cause, nextVisiting)
      : ACCEPTED_ADVISORIES.has(cause.url),
  )

  acceptedCache.set(name, accepted)
  return accepted
}

const blocked = []
const accepted = []
for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  if (!BLOCKED_SEVERITIES.has(vulnerability.severity)) continue
  ;(isAcceptedChain(name) ? accepted : blocked).push({ name, severity: vulnerability.severity })
}

for (const finding of accepted) {
  console.warn(`Accepted ${finding.severity} advisory chain: ${finding.name}`)
}

if (blocked.length > 0) {
  console.error('Unaccepted dependency advisories:')
  for (const finding of blocked) console.error(`- ${finding.name} (${finding.severity})`)
  process.exit(1)
}

const counts = report.metadata?.vulnerabilities ?? {}
console.log(
  `Dependency audit passed: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ${counts.moderate ?? 0} moderate; ${accepted.length} package chain(s) covered by a documented non-runtime exception.`,
)
