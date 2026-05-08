const DEFAULT_BASE_URL = 'https://hireproof.tech'

function normalizeBaseUrl(baseUrl) {
  const value = String(baseUrl || DEFAULT_BASE_URL).trim()
  return value.replace(/\/+$/, '')
}

function buildAuditRequestBody({ text, location, mode, webhookUrl }) {
  const body = {
    text: String(text || '').trim(),
    mode: mode || 'demo',
  }

  if (location) body.location = String(location).trim()
  if (webhookUrl) body.webhook_url = String(webhookUrl).trim()

  return body
}

function buildAuditRequestOptions({ baseUrl, apiKey, text, location, mode, webhookUrl }) {
  if (!apiKey) throw new Error('HireProof API key is required.')

  const body = buildAuditRequestBody({ text, location, mode, webhookUrl })
  if (!body.text) throw new Error('HireProof audit text is required.')

  return {
    method: 'POST',
    url: `${normalizeBaseUrl(baseUrl)}/api/v1/audit`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body,
    json: true,
  }
}

module.exports = {
  DEFAULT_BASE_URL,
  normalizeBaseUrl,
  buildAuditRequestBody,
  buildAuditRequestOptions,
}
