import type { CursorRunRuntime } from './types'

function trimEnv(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.replace(/\r\n|\n|\r/g, '').trim()
  return trimmed || null
}

export function isCursorIntegrationEnabled() {
  return trimEnv(process.env.CURSOR_INTEGRATION_ENABLED) === 'true'
}

export function getCursorApiKey() {
  return trimEnv(process.env.CURSOR_API_KEY)
}

export interface CursorIntegrationConfig {
  enabled: boolean
  apiKey: string | null
  modelId: string
  runtimeDefault: CursorRunRuntime
  allowedRepoUrl: string | null
  maxConcurrentRuns: number
  webhookSecret: string | null
}

export function getCursorConfig(): CursorIntegrationConfig {
  const runtimeRaw = trimEnv(process.env.CURSOR_RUNTIME_DEFAULT)?.toLowerCase()
  return {
    enabled: isCursorIntegrationEnabled(),
    apiKey: getCursorApiKey(),
    modelId: trimEnv(process.env.CURSOR_MODEL_ID) || 'composer-2',
    runtimeDefault: runtimeRaw === 'local' ? 'local' : 'cloud',
    allowedRepoUrl: trimEnv(process.env.CURSOR_ALLOWED_REPO_URL),
    maxConcurrentRuns: Math.max(1, Number.parseInt(trimEnv(process.env.CURSOR_MAX_CONCURRENT_RUNS) || '2', 10) || 2),
    webhookSecret: trimEnv(process.env.CURSOR_WEBHOOK_SECRET),
  }
}

export function isCursorOperational() {
  const config = getCursorConfig()
  return config.enabled && Boolean(config.apiKey)
}

export function resolveAllowedRepoUrl(config: CursorIntegrationConfig) {
  return config.allowedRepoUrl || trimEnv(process.env.GITHUB_REPO_URL)
}
