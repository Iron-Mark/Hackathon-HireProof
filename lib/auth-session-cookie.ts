export const AUTH_SESSION_COOKIE_NAME = 'hireproof_session'
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

interface SessionCookieReader {
  get: (name: string) => { value: string } | undefined
}

interface SessionCookieWriter {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: true
      sameSite: 'lax'
      secure: boolean
      path: '/'
      maxAge: number
    },
  ) => void
}

export function authSessionCookieOptions(maxAge = AUTH_SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  } as const
}

export function getAuthSessionToken(cookieStore: SessionCookieReader) {
  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value
}

export function setAuthSessionCookie(cookieStore: SessionCookieWriter, token: string, maxAge = AUTH_SESSION_TTL_SECONDS) {
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, token, authSessionCookieOptions(maxAge))
}

export function clearAuthSessionCookie(cookieStore: SessionCookieWriter) {
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, '', authSessionCookieOptions(0))
}
