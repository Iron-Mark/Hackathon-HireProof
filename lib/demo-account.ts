export const DEMO_ACCOUNT_EMAIL = 'judge@hackathon.com'
export const DEMO_ACCOUNT_PASSWORD = 'hireproof2026'
export const DEMO_ACCOUNT_NAME = 'Demo Judge'
export const DEMO_SESSION_TTL_SECONDS = 60 * 60 * 2

export function isDemoAccountEmail(email: unknown) {
  return String(email || '').trim().toLowerCase() === DEMO_ACCOUNT_EMAIL
}
