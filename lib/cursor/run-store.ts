import crypto from 'crypto'
import type { CursorRunKind, CursorRunRecord, CursorRunRuntime, CursorRunStatus } from './types'

const runs = new Map<string, CursorRunRecord>()
const MAX_RUNS_PER_OWNER = 50

function now() {
  return new Date().toISOString()
}

export async function createRunRecord(input: {
  ownerId: string
  kind: CursorRunKind
  preset?: string
  prompt: string
  runtime: CursorRunRuntime
  status?: CursorRunStatus
}) {
  const timestamp = now()
  const record: CursorRunRecord = {
    id: `cursor_run_${crypto.randomUUID()}`,
    ownerId: input.ownerId,
    kind: input.kind,
    preset: input.preset,
    promptSummary: input.prompt.trim().slice(0, 240),
    runtime: input.runtime,
    status: input.status || 'starting',
    cursorRunId: null,
    cursorAgentId: null,
    errorMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  }

  runs.set(record.id, record)
  pruneOwnerRuns(input.ownerId)
  return record
}

export async function updateRunRecord(
  id: string,
  patch: Partial<Pick<CursorRunRecord, 'status' | 'cursorRunId' | 'cursorAgentId' | 'errorMessage' | 'completedAt'>>,
) {
  const existing = runs.get(id)
  if (!existing) return null

  const updated: CursorRunRecord = {
    ...existing,
    ...patch,
    updatedAt: now(),
  }
  runs.set(id, updated)
  return updated
}

export async function getRunRecord(id: string) {
  return runs.get(id) || null
}

export async function listRunsForOwner(ownerId: string, limit = 20) {
  return [...runs.values()]
    .filter((run) => run.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function countActiveRuns(ownerId: string) {
  return [...runs.values()].filter(
    (run) => run.ownerId === ownerId && (run.status === 'starting' || run.status === 'running'),
  ).length
}

function pruneOwnerRuns(ownerId: string) {
  const ownerRuns = [...runs.values()]
    .filter((run) => run.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  for (const stale of ownerRuns.slice(MAX_RUNS_PER_OWNER)) {
    runs.delete(stale.id)
  }
}
