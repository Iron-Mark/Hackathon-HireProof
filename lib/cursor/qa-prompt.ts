export function buildHireProofQaPrompt(baseUrl: string) {
  const origin = baseUrl.replace(/\/$/, '')

  return `
Open ${origin}/audit and verify:
- textarea input renders
- demo buttons render
- submit flow is visible
- results/loading/error states are understandable

Open ${origin}/developer and verify:
- provider credentials UI renders
- usage cards and activity lists are visible

Open ${origin}/docs and verify:
- API playground renders
- response pane works
- code examples and docs nav are present

Record screenshots and logs for any failure.
Do not modify production. Report findings clearly.
`.trim()
}
