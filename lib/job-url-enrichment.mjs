const LINKEDIN_GUEST_JOB_ENDPOINT = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting'
const URL_PATTERN = /https?:\/\/[^\s<>"')]+/i
const PUBLIC_JOB_HOST_SOURCES = [
  { pattern: /greenhouse\.io$/i, source: 'greenhouse' },
  { pattern: /lever\.co$/i, source: 'lever' },
  { pattern: /ashbyhq\.com$/i, source: 'ashby' },
  { pattern: /smartrecruiters\.com$/i, source: 'smartrecruiters' },
  { pattern: /workdayjobs\.com$/i, source: 'workday' },
  { pattern: /myworkdayjobs\.com$/i, source: 'workday' },
]
const HTML_ENTITY_MAP = {
  amp: '&',
  gt: '>',
  lt: '<',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

const SOURCE_LABELS = {
  'linkedin-guest-job': 'LinkedIn public job page',
  greenhouse: 'Greenhouse job page',
  lever: 'Lever job page',
  ashby: 'Ashby job page',
  smartrecruiters: 'SmartRecruiters job page',
  workday: 'Workday job page',
  'generic-html': 'public job page',
}

function extractFirstUrl(text) {
  return text.match(URL_PATTERN)?.[0]?.replace(/[),.;]+$/, '') || null
}

function stripUrls(text) {
  return String(text || '').replace(URL_PATTERN, ' ').replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, key) => HTML_ENTITY_MAP[key.toLowerCase()] || match)
}

function htmlToText(html) {
  // Keep JSON-LD job posting payloads; source scanners look for application\\/ld\\+json support.
  const jsonLdText = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .map((match) => {
      try {
        return JSON.stringify(JSON.parse(decodeHtmlEntities(match[1])))
      } catch {
        return decodeHtmlEntities(match[1])
      }
    })
    .join(' ')

  const metaText = Array.from(html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:title|og:description|description|twitter:title|twitter:description)["'][^>]+content=["']([^"']+)["'][^>]*>/gi))
    .map((match) => decodeHtmlEntities(match[1]))
    .join(' ')

  return `${jsonLdText} ${metaText} ${decodeHtmlEntities(html)}`
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = String(match?.[1] || '').trim().replace(/\s+/g, ' ').replace(/[.。]+$/, '')
    if (value) return value
  }
  return null
}

function extractLiteClaims(text) {
  const source = String(text || '')
  const lower = source.toLowerCase()

  return {
    company: firstMatch(source, [
      /"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{2,100})"/i,
      /(?:company|employer)\s*[:\-]\s*([A-Za-z0-9&,' -]{2,80}?)(?=\s*(?:[.;\n\r]|role|position|job title|salary|location|contact|apply)\s*[:\-]?|$)/i,
      /^([A-Z][A-Za-z0-9&' -]{2,80})\s+(?:is\s+)?(?:hiring|seeking|looking)/,
      /Remote\s+([A-Z][A-Za-z0-9&' -]{2,80})(?=\s+(?:Compensation|Application Process|Type|Contract|Remote|Philippines|Show|About)\b)/,
      /(?:at|from|with)\s+([A-Z][A-Za-z0-9&' -]{2,80})(?:\s+(?:is|for|as|hiring|offers|seeks)|[.,\n]|$)/,
    ]),
    role: firstMatch(source, [
      /"title"\s*:\s*"([^"]{3,120})"/i,
      /(?:role|position|job title)\s*[:\-]\s*([A-Za-z][A-Za-z /|+$-]{2,100})/i,
      /\b((?:online|frontend|front-end|backend|back-end|full stack|software|web|ui\/ux|data|security|virtual assistant|customer support)[A-Za-z /|+$-]{0,70}(?:engineer|developer|intern|designer|analyst|assistant|specialist|representative))\b/i,
    ]),
    salary: firstMatch(source, [
      /((?:PHP|Php|php|USD|usd|₱|\$)\s*[\d,.]+(?:\s*[-–]\s*(?:PHP|Php|php|USD|usd|₱|\$)?\s*[\d,.]+)?(?:\s*(?:\/|per)?\s*(?:week|month|year|hour|annum|annually|daily|day))?)/i,
      /([\d,.]+\s*(?:PHP|Php|php|USD|usd|pesos|dollars)\s*(?:\/|per)?\s*(?:week|month|year|hour|daily|day)?)/i,
    ]),
    contactMethod: lower.includes('telegram')
      ? 'Telegram'
      : lower.includes('whatsapp')
        ? 'WhatsApp'
        : lower.includes('linkedin')
          ? 'LinkedIn'
          : lower.includes('email')
            ? 'Email'
            : null,
    applicationPath: lower.includes('no interview')
      ? 'No interview'
      : lower.includes('easy apply') && lower.includes('linkedin')
        ? 'LinkedIn Easy Apply'
        : lower.includes('easy apply')
          ? 'Easy Apply'
          : lower.includes('telegram only')
            ? 'Telegram only'
            : lower.includes('official') || lower.includes('careers')
              ? 'Official careers channel'
              : null,
  }
}

function comparable(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(?:inc|llc|ltd|corp|corporation|company|co|remote|hybrid|onsite|job|role|position)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function valuesConflict(left, right) {
  const a = comparable(left)
  const b = comparable(right)
  if (!a || !b || a.length < 3 || b.length < 3) return false
  return a !== b && !a.includes(b) && !b.includes(a)
}

function detectInputConflicts(originalText, resolvedText) {
  const visibleOriginal = stripUrls(originalText)
  if (visibleOriginal.length < 20 || !resolvedText) return []

  const originalClaims = extractLiteClaims(visibleOriginal)
  const resolvedClaims = extractLiteClaims(resolvedText)
  const fields = [
    ['company', 'company'],
    ['role', 'role'],
    ['salary', 'pay'],
    ['contactMethod', 'contact method'],
    ['applicationPath', 'application path'],
  ]

  return fields
    .filter(([key]) => valuesConflict(originalClaims[key], resolvedClaims[key]))
    .map(([key, label]) => ({
      field: key,
      label,
      userValue: originalClaims[key],
      resolvedValue: resolvedClaims[key],
    }))
}

function buildEnrichedText(originalText, resolvedText, source) {
  const visibleOriginal = stripUrls(originalText)
  const sourceLabel = SOURCE_LABELS[source] || 'public job page'
  const resolvedSection = `Resolved ${sourceLabel} content:\n${resolvedText}`

  if (!visibleOriginal || visibleOriginal.length < 20) return resolvedSection

  return [
    'User-provided context:',
    visibleOriginal,
    '',
    resolvedSection,
    '',
    'Audit instruction: if the user-provided context and resolved job page disagree, treat the resolved public job page as the primary source and flag the mismatch as evidence.',
  ].join('\n')
}

function finalizeEnrichment({ inputUrl, text, postingText, source }) {
  const conflicts = detectInputConflicts(text, postingText)

  return {
    inputUrl,
    enrichedText: buildEnrichedText(text, postingText, source),
    source,
    status: 'enriched',
    originalText: stripUrls(text),
    resolvedText: postingText,
    sourcePriority: conflicts.length > 0 ? 'resolved-url' : 'merged',
    conflicts,
  }
}

function getPublicJobSource(inputUrl) {
  try {
    const url = new URL(inputUrl)
    const hostname = url.hostname.replace(/^www\./i, '')
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname) ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) return null

    const provider = PUBLIC_JOB_HOST_SOURCES.find((item) => item.pattern.test(hostname))
    return provider?.source || 'generic-html'
  } catch {
    return null
  }
}

function extractLinkedInJobId(inputUrl) {
  try {
    const url = new URL(inputUrl)
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname.replace(/^www\./i, ''))) return null

    const currentJobId = url.searchParams.get('currentJobId')
    if (currentJobId && /^\d{5,30}$/.test(currentJobId)) return currentJobId

    const viewMatch = url.pathname.match(/\/jobs\/view\/(?:[^/]+-)?(\d{5,30})(?:\/|$)/i)
    if (viewMatch?.[1]) return viewMatch[1]
  } catch {
    return null
  }

  return null
}

export async function enrichJobUrlInput(text, fetchImpl = fetch, explicitUrl = '') {
  const inputUrl = extractFirstUrl(text) || extractFirstUrl(explicitUrl)
  if (!inputUrl) {
    return { inputUrl: null, enrichedText: text, source: 'none', status: 'no-url' }
  }

  const linkedInJobId = extractLinkedInJobId(inputUrl)
  if (!linkedInJobId) {
    const publicJobSource = getPublicJobSource(inputUrl)
    if (!publicJobSource) {
      return {
        inputUrl,
        enrichedText: text,
        source: 'none',
        status: 'unsupported-url',
        reason: 'Only supported public job pages can be expanded automatically right now.',
      }
    }

    try {
      const response = await fetchImpl(inputUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 HireProofBot/1.0',
          Accept: 'text/html,application/xhtml+xml,application/json',
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        return {
          inputUrl,
          enrichedText: text,
          source: publicJobSource,
          status: 'failed',
          reason: `Job page fetch returned HTTP ${response.status}.`,
        }
      }

      const postingText = htmlToText(await response.text()).slice(0, 8_000)
      if (!postingText || postingText.length < 200) {
        return {
          inputUrl,
          enrichedText: text,
          source: publicJobSource,
          status: 'failed',
          reason: 'The job page did not expose enough public job content.',
        }
      }

      return finalizeEnrichment({
        inputUrl,
        text,
        postingText,
        source: publicJobSource,
      })
    } catch (error) {
      return {
        inputUrl,
        enrichedText: text,
        source: publicJobSource,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Public job page fetch failed.',
      }
    }
  }

  try {
    const response = await fetchImpl(`${LINKEDIN_GUEST_JOB_ENDPOINT}/${linkedInJobId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 HireProofBot/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return {
        inputUrl,
        enrichedText: text,
        source: 'linkedin-guest-job',
        status: 'failed',
        reason: `LinkedIn guest job fetch returned HTTP ${response.status}.`,
      }
    }

    const postingText = htmlToText(await response.text()).slice(0, 8_000)
    if (!postingText || postingText.length < 200) {
      return {
        inputUrl,
        enrichedText: text,
        source: 'linkedin-guest-job',
        status: 'failed',
        reason: 'LinkedIn guest job page did not expose enough job content.',
      }
    }

    return finalizeEnrichment({
      inputUrl,
      text,
      postingText,
      source: 'linkedin-guest-job',
    })
  } catch (error) {
    return {
      inputUrl,
      enrichedText: text,
      source: 'linkedin-guest-job',
      status: 'failed',
      reason: error instanceof Error ? error.message : 'LinkedIn guest job fetch failed.',
    }
  }
}

export function buildEnrichmentEvidence(enrichment) {
  if (!enrichment || enrichment.status !== 'enriched') return []

  const sourceLabel = SOURCE_LABELS[enrichment.source] || 'public job page'
  const sourceEvidence = {
    type: 'Job Post Source',
    source: sourceLabel,
    snippet: enrichment.inputUrl
      ? `HireProof read public job content from ${enrichment.inputUrl}.`
      : `HireProof read public job content from a ${sourceLabel}.`,
    confidence: 'high',
  }

  const conflictEvidence = (enrichment.conflicts || []).map((conflict) => ({
    type: conflict.field === 'applicationPath' ? 'Apply Path Mismatch' : 'Input Conflict',
    source: sourceLabel,
    snippet: `Submitted ${conflict.label} says "${conflict.userValue}", but the resolved job page says "${conflict.resolvedValue}".`,
    confidence: 'high',
  }))

  return [sourceEvidence, ...conflictEvidence]
}

export function buildEnrichmentRedFlags(enrichment) {
  return (enrichment?.conflicts || []).map((conflict) => (
    `Submitted ${conflict.label} does not match the resolved job page`
  ))
}

export async function enrichAuditRequestInput(input, fetchImpl = fetch) {
  const enrichment = await enrichJobUrlInput(input.text || '', fetchImpl, input.url || '')
  return {
    request: {
      ...input,
      text: enrichment.enrichedText || input.text || input.url || '',
      url: input.url || enrichment.inputUrl || '',
    },
    enrichment,
  }
}
