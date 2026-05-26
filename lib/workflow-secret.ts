const WORKFLOW_SECRET_MIN_LENGTH = 32
const WORKFLOW_SECRET_MIN_DISTINCT_CHARS = 8

const PUBLIC_WORKFLOW_SECRET_PLACEHOLDERS = new Set([
  'paste_generated_workflow_secret_here',
  'generated-random-hex',
  'your_workflow_secret',
  'your-workflow-secret',
  'workflow_secret',
  'workflow-secret',
  'changeme',
  'change-me',
  'secret',
  'password',
])

export type WorkflowSecretStatus = {
  present: boolean
  valid: boolean
  reason: 'missing' | 'placeholder' | 'too-short' | 'low-entropy' | 'ready'
}

export function getWorkflowSecret() {
  return process.env.WORKFLOW_SECRET?.trim() || ''
}

export function getWorkflowSecretStatus(value = getWorkflowSecret()): WorkflowSecretStatus {
  const secret = value.trim()

  if (!secret) {
    return { present: false, valid: false, reason: 'missing' }
  }

  if (PUBLIC_WORKFLOW_SECRET_PLACEHOLDERS.has(secret.toLowerCase())) {
    return { present: true, valid: false, reason: 'placeholder' }
  }

  if (secret.length < WORKFLOW_SECRET_MIN_LENGTH) {
    return { present: true, valid: false, reason: 'too-short' }
  }

  if (new Set(secret).size < WORKFLOW_SECRET_MIN_DISTINCT_CHARS) {
    return { present: true, valid: false, reason: 'low-entropy' }
  }

  return { present: true, valid: true, reason: 'ready' }
}
