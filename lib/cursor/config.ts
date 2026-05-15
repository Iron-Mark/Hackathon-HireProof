import type { CursorRunRuntime } from './types'

export function isCursorIntegrationEnabled() {
  return process.env.CURSOR_INTEGRATION_ENABLED === 'true'
}

export function getCursorApiKey() {
  const key = process.env.CURSOR_API_KEY?.trim()
  return key || null
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
  const runtimeRaw = process.env.CURSOR_RUNTIME_DEFAULT?.trim().toLowerCase()
  return {
    enabled: isCursorIntegrationEnabled(),
    apiKey: getCursorApiKey(),
    modelId: process.env.CURSOR_MODEL_ID?.trim() || 'composer-2',
    runtimeDefault: runtimeRaw === 'local' ? 'local' : 'cloud',
    allowedRepoUrl: process.env.CURSOR_ALLOWED_REPO_URL?.trim() || null,
    maxConcurrentRuns: Math.max(1, Number.parseInt(process.env.CURSOR_MAX_CONCURRENT_RUNS || '2', 10) || 2),
    webhookSecret: process.env.CURSOR_WEBHOOK_SECRET?.trim() || null,
  }
}

export function isCursorOperational() {
  const config = getCursorConfig()
  return config.enabled && Boolean(config.apiKey)
}

export function resolveAllowedRepoUrl(config: CursorIntegrationConfig) {
  return config.allowedRepoUrl || process.env.GITHUB_REPO_URL?.trim() || null
}
