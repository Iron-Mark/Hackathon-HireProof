export type CursorRunStatus = 'starting' | 'running' | 'completed' | 'failed' | 'cancelled'
export type CursorRunRuntime = 'local' | 'cloud'
export type CursorRunKind = 'developer' | 'nightly-repo-health' | 'ui-qa'

export interface CursorRunRecord {
  id: string
  ownerId: string
  kind: CursorRunKind
  preset?: string
  promptSummary: string
  runtime: CursorRunRuntime
  status: CursorRunStatus
  cursorRunId: string | null
  cursorAgentId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface CursorPublicStatus {
  enabled: boolean
  configured: boolean
  operational: boolean
  runtimeDefault: CursorRunRuntime
  allowedRepoPinned: boolean
  maxConcurrentRuns: number
}
