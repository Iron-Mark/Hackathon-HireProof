export const DEFAULT_INTERNAL_BASE_URL = 'http://127.0.0.1:3002'

export function getTrustedInternalBaseUrl(configuredBaseUrl = process.env.APP_BASE_URL) {
  return (configuredBaseUrl?.trim() || DEFAULT_INTERNAL_BASE_URL).replace(/\/+$/, '')
}
