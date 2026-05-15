import { getCursorConfig, isCursorOperational, resolveAllowedRepoUrl } from './config'
import { countActiveRuns, createRunRecord, updateRunRecord } from './run-store'
import type { CursorPublicStatus, CursorRunKind, CursorRunRecord, CursorRunRuntime } from './types'

export interface StartCursorRunInput {
  ownerId: string
  prompt: string
  kind?: CursorRunKind
  preset?: string
  runtime?: CursorRunRuntime
}

export interface CursorRunStartResult {
  ok: boolean
  disabled?: boolean
  reason?: string
  run?: CursorRunRecord
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Cursor run failed.'
  return message
    .replace(/cursor_[a-zA-Z0-9_-]+/gi, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
}

function assertAllowedRepo(repoUrl: string, allowedRepoUrl: string | null) {
  if (!allowedRepoUrl) return
  if (repoUrl !== allowedRepoUrl) {
    throw new Error('Repository URL is not allowed for Cursor runs.')
  }
}

export function getCursorPublicStatus(): CursorPublicStatus {
  const config = getCursorConfig()
  return {
    enabled: config.enabled,
    configured: Boolean(config.apiKey),
    operational: isCursorOperational(),
    runtimeDefault: config.runtimeDefault,
    allowedRepoPinned: Boolean(config.allowedRepoUrl),
    maxConcurrentRuns: config.maxConcurrentRuns,
  }
}

export async function startCursorRun(input: StartCursorRunInput): Promise<CursorRunStartResult> {
  const config = getCursorConfig()

  if (!config.enabled) {
    return { ok: false, disabled: true, reason: 'Cursor integration is disabled.' }
  }

  if (!config.apiKey) {
    return { ok: false, disabled: true, reason: 'CURSOR_API_KEY is not configured.' }
  }

  const activeRuns = await countActiveRuns(input.ownerId)
  if (activeRuns >= config.maxConcurrentRuns) {
    return { ok: false, reason: 'Maximum concurrent Cursor runs reached. Try again later.' }
  }

  const runtime = input.runtime || config.runtimeDefault
  const record = await createRunRecord({
    ownerId: input.ownerId,
    kind: input.kind || 'developer',
    preset: input.preset,
    prompt: input.prompt,
    runtime,
    status: 'starting',
  })

  try {
    const { Agent } = await import('@cursor/sdk')
    const agentOptions: Record<string, unknown> = {
      apiKey: config.apiKey,
      model: { id: config.modelId },
    }

    if (runtime === 'cloud') {
      const repoUrl = resolveAllowedRepoUrl(config)
      if (!repoUrl) {
        throw new Error('CURSOR_ALLOWED_REPO_URL or GITHUB_REPO_URL is required for cloud runs.')
      }
      assertAllowedRepo(repoUrl, config.allowedRepoUrl)
      agentOptions.cloud = {
        repos: [{ url: repoUrl, startingRef: 'main' }],
        skipReviewerRequest: true,
      }
    } else {
      agentOptions.local = { cwd: process.cwd() }
    }

    const agent = await Agent.create(agentOptions as Parameters<typeof Agent.create>[0])

    try {
      const run = await agent.send(input.prompt)
      const cursorRunId = typeof (run as { id?: unknown }).id === 'string' ? (run as { id: string }).id : null
      const cursorAgentId =
        typeof (run as { agentId?: unknown }).agentId === 'string' ? (run as { agentId: string }).agentId : null

      const running = await updateRunRecord(record.id, {
        status: 'running',
        cursorRunId,
        cursorAgentId,
      })

      void finalizeCursorRun(agent, run, record.id)

      return {
        ok: true,
        run: running || record,
      }
    } catch (error) {
      await updateRunRecord(record.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorMessage: sanitizeErrorMessage(error),
      })
      await agent[Symbol.asyncDispose]()
      throw error
    }
  } catch (error) {
    await updateRunRecord(record.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: sanitizeErrorMessage(error),
    })
    return { ok: false, reason: sanitizeErrorMessage(error) }
  }
}

async function finalizeCursorRun(agent: { [Symbol.asyncDispose]: () => Promise<void> }, run: { wait: () => Promise<{ status: string }> }, recordId: string) {
  try {
    const result = await run.wait()
    const status = result.status === 'finished' ? 'completed' : result.status === 'error' ? 'failed' : 'cancelled'
    await updateRunRecord(recordId, {
      status,
      completedAt: new Date().toISOString(),
    })
  } catch (error) {
    await updateRunRecord(recordId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: sanitizeErrorMessage(error),
    })
  } finally {
    await agent[Symbol.asyncDispose]()
  }
}
