function isWeak(value, weakTerms) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || weakTerms.some((term) => normalized.includes(term))
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function cleanMatch(value) {
  return String(value || '')
    .trim()
    .replace(/\s+By\s+\d+x?\s+See\s+Who\s+You\s+Know\b.*$/i, '')
    .replace(/\s+\d+x?\s+See\s+Who\s+You\s+Know\b.*$/i, '')
    .replace(/\s+See\s+Who\s+You\s+Know\b.*$/i, '')
    .replace(/\s+(?:role|position|job title|salary|location|contact|apply)\s*[:\-].*$/i, '')
    .replace(/[.。]+$/, '')
    .replace(/\s+/g, ' ')
}

function cleanCompany(value) {
  return titleCase(cleanMatch(value)
    .replace(/\s+\d[\d,.\s]*\s+\b(?:followers?|connections?)\b.*$/i, '')
    .replace(/\s+\b(?:followers?|connections?)\b.*$/i, '')
    .replace(/\s+\b(?:promoted|actively hiring)\b.*$/i, ''))
}

function cleanRole(value) {
  const cleaned = cleanMatch(value)
    .replace(/^\s*at\s+[A-Z][A-Za-z0-9&' -]{2,80}$/i, '')
    .replace(/\s+\bat\s+[A-Z][A-Za-z0-9&' -]{2,80}$/i, '')
    .trim()
  if (!isPlausibleRole(cleaned)) return ''
  return cleaned ? titleCase(cleaned) : ''
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = cleanMatch(match?.[1] || '')
    if (value) return value
  }
  return null
}

const ROLE_KEYWORDS = [
  'online',
  'frontend',
  'front-end',
  'backend',
  'back-end',
  'full stack',
  'software',
  'web',
  'ui/ux',
  'data',
  'security',
  'virtual assistant',
  'customer support',
  'quality assurance',
  'qa',
  'automation',
  'sdet',
  'software development engineer in test',
  'test automation',
  'manual qa',
  'software test',
  'tester',
]

const ROLE_SUFFIXES = [
  'engineer',
  'developer',
  'intern',
  'designer',
  'analyst',
  'assistant',
  'specialist',
  'representative',
  'tester',
  'sdet',
  'qa',
]

const ROLE_TITLE_REGEX = new RegExp(
  `\\b((?:${ROLE_KEYWORDS.map(escapeRegExp).join('|')})[A-Za-z0-9 /|+&().-]{0,80}?(?:${ROLE_SUFFIXES.map(escapeRegExp).join('|')})(?:\\s*(?:I{1,3}|IV|V|[0-9]))?)\\b`,
  'i',
)

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPlausibleRole(value) {
  const text = String(value || '').trim()
  if (!text) return false
  if (/^(?:team|hiring team|people|company|job poster|about the company|applicants?|followers?)$/i.test(text)) return false
  if (/\b(?:followers?|applicants?|promoted|premium|reactivate|save|show match|see who you know)\b/i.test(text)) return false
  if (ROLE_TITLE_REGEX.test(text)) return true
  return /\b(?:engineer|developer|analyst|assistant|specialist|designer|representative|manager|consultant|tester|architect|administrator|qa|sdet)\b/i.test(text)
}

function cleanLocation(value) {
  return cleanMatch(value)
    .replace(/\s*[·|].*$/g, '')
    .replace(/\b(?:on-site|onsite|hybrid|remote|contract|full-time|part-time|easy apply)\b.*$/i, '')
    .trim()
}

function extractLocation(text) {
  const source = String(text || '')
  const explicit = firstMatch(source, [
    /(?:location|job location|work location|based)\s*[:\-]\s*([^\n;]{2,120})/i,
  ])
  if (explicit) return cleanLocation(explicit)

  const linkedInLine = source.match(/\b((?:Manila|Makati|Taguig|Quezon City|Pasig|Mandaluyong|Cebu|Davao|Pasay|Paranaque|Muntinlupa|Calamba|Singapore|Kuala Lumpur|Sydney|Melbourne|Toronto|Vancouver|Seattle|New York|London)[^,]{0,50},\s*(?:National Capital Region|Metro Manila|NCR|[A-Z][A-Za-z .'-]+),\s*(?:Philippines|United States|Canada|Australia|United Kingdom|Singapore|Malaysia|India))\b(?:\s*[·|]|\s|$)/)
  if (linkedInLine?.[1]) return cleanLocation(linkedInLine[1])

  const cityCountry = source.match(/\b([A-Z][A-Za-z .'-]+,\s*(?:Philippines|Singapore|Malaysia|India|Australia|Canada|United States|United Kingdom))\b/)
  if (cityCountry?.[1]) return cleanLocation(cityCountry[1])

  if (/\bremote\b/i.test(source)) return 'Remote'
  return null
}

function extractRole(text) {
  const explicit = firstMatch(text, [
    /(?:role|position|job title)\s*[:\-]\s*([A-Za-z][A-Za-z /+-]{2,80})/i,
    ROLE_TITLE_REGEX,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Za-z][A-Za-z /+-]{2,80})(?:\s+(?:at|for|in|with)|[.,\n]|$)/i,
  ])

  if (!explicit) return null
  const cleaned = cleanRole(explicit.replace(/\s+(?:at|for|with|in)\s+.*$/i, ''))
  return cleaned || null
}

function extractCompany(text, url) {
  const fromText = firstMatch(text, [
    /(?:company|employer)\s*[:\-]\s*([A-Za-z0-9&,' -]{2,70}?)(?=\s*(?:[.;\n\r]|role|position|job title|salary|location|contact|apply)\s*[:\-]?|$)/i,
    /(?:at|from|with)\s+([A-Z][A-Za-z0-9&' -]{2,70})(?:\s+(?:is|for|as|hiring|offers|seeks)|[.,\n]|$)/,
  ])

  if (fromText) return cleanCompany(fromText)

  if (!url) return null
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const [name] = hostname.split('.')
    return name ? cleanCompany(name) : null
  } catch {
    return null
  }
}

function extractSalary(text) {
  return firstMatch(text, [
    /((?:PHP|Php|php|USD|usd|₱|\$)\s*[\d,.]+(?:\s*[-–]\s*(?:PHP|Php|php|USD|usd|₱|\$)?\s*[\d,.]+)?(?:\s*(?:\/|per)?\s*(?:week|month|year|hour|annum|annually))?)/i,
    /([\d,.]+\s*(?:PHP|Php|php|USD|usd|pesos|dollars)\s*(?:\/|per)?\s*(?:week|month|year|hour)?)/i,
  ])
}

function extractContactMethod(text) {
  const lower = text.toLowerCase()
  if (lower.includes('telegram')) return 'Telegram'
  if (lower.includes('whatsapp')) return 'WhatsApp'
  if (lower.includes('linkedin')) return 'LinkedIn'
  if (lower.includes('email')) return 'Email'
  return null
}

function extractApplicationPath(text, url) {
  const lower = text.toLowerCase()
  if (lower.includes('no interview')) return 'No interview mentioned'
  const host = hostnameFromUrl(url)
  if (hostMatchesDomain(host, 'linkedin.com')) return lower.includes('easy apply') ? 'LinkedIn Easy Apply' : 'LinkedIn job page'
  if (hostMatchesDomain(host, 'greenhouse.io')) return 'Greenhouse job page'
  if (hostMatchesDomain(host, 'lever.co')) return 'Lever job page'
  if (hostMatchesDomain(host, 'ashbyhq.com')) return 'Ashby job page'
  if (hostMatchesDomain(host, 'smartrecruiters.com')) return 'SmartRecruiters job page'
  if (hostMatchesDomain(host, 'workdayjobs.com') || hostMatchesDomain(host, 'myworkdayjobs.com')) return 'Workday job page'
  if (lower.includes('easy apply') && lower.includes('linkedin')) return 'LinkedIn Easy Apply'
  if (lower.includes('direct message') || lower.includes('dm ') || lower.includes('message ') || lower.includes('telegram only')) return 'Direct message'
  if (url) return 'Provided job URL'
  if (lower.includes('official') || lower.includes('careers')) return 'Official careers channel'
  return null
}

function hostnameFromUrl(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function hostMatchesDomain(host, domain) {
  const normalizedHost = String(host || '').replace(/^www\./i, '').toLowerCase()
  const normalizedDomain = String(domain || '').replace(/^www\./i, '').toLowerCase()
  return Boolean(normalizedHost && (normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`)))
}

function extractRecruiterName(text) {
  const fromLabel = firstMatch(text, [
    /(?:recruiter|hiring manager|contact person|contact)\s*[:\-]\s*([A-Za-z][A-Za-z .' -]{2,80}?)(?=\s*(?:[.;\n\r]|email|phone|linkedin|profile|apply)\s*[:\-]?|$)/i,
    /(?:meet the hiring team|people you can reach out to)\s+([A-Z][A-Za-z .' -]{2,80}?)(?=\s+(?:job poster|malaysia|singapore|markets|recruiter|hiring|contact)|[.;\n\r]|$)/i,
    /(?:^|[.;\n\r])\s*([A-Z][A-Za-z .' -]{2,80})\s+(?:job poster|recruiter)\b/i,
    /(?:message|contact|email)\s+([A-Z][A-Za-z .' -]{2,80})\s+(?:at|via|on|for)/,
  ])
  return fromLabel && !/^(?:team|people|contact)$/i.test(fromLabel) ? fromLabel : null
}

function extractRecruiterEmail(text) {
  const match = String(text || '').match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
  return match?.[0] || null
}

function extractRecruiterProfile(text) {
  const match = String(text || '').match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:in|pub)\/[^\s)]+/i)
  return match?.[0]?.replace(/[.,;:]+$/, '') || null
}

function extractRecruiterPhone(text) {
  const match = String(text || '').match(/(?:phone|mobile|tel|call|contact number)\s*[:\-]?\s*(\+?\d[\d ()-]{7,}\d)/i)
  return match?.[0]?.trim() || null
}

function extractLinkedInPageClaims(text, claims = {}) {
  if (!/Resolved LinkedIn public job page content|linkedin\.com\/jobs/i.test(`${text} ${claims?.applicationPath || ''}`)) return {}

  const source = String(text || '')
  const lines = source
    .replace(/^.*?Resolved LinkedIn public job page content:\s*/is, '')
    .split(/\r?\n/)
    .map(line => cleanMatch(line))
    .filter(Boolean)
    .filter(line => !/^(?:promoted by hirer|actively reviewing applicants|save|use ai|show match|tailor my resume|help me stand out|people you can reach out to|meet the hiring team|about the job|about the company)$/i.test(line))

  const companyHint = cleanCompany(claims.company || '')
  const roleFromLine = lines.map(cleanRole).find(Boolean)
  const roleFromText = extractRole(source)
  const locationFromText = extractLocation(source)
  const jobPosterIndex = lines.findIndex(line => /^job poster$/i.test(line))
  const recruiterFromLines = jobPosterIndex > 0
    ? [...lines.slice(0, jobPosterIndex)].reverse().find(line =>
      /^[A-Z][A-Za-z .' -]{2,80}$/.test(line) &&
      !cleanRole(line) &&
      !/\b(?:markets?|hiring team|people|company|followers?|applicants?|easy apply|contract|on-site|onsite|remote|hybrid)\b/i.test(line) &&
      line.split(/\s+/).length >= 2
    )
    : null
  const recruiterName = recruiterFromLines || extractRecruiterName(source)
  const companyFromLine = lines.find((line, index) => {
    if (roleFromLine && cleanRole(line)) return false
    if (locationFromText && cleanLocation(line) === locationFromText) return false
    if (!index && roleFromLine) return false
    return /^[A-Z][A-Za-z0-9&' .-]{2,100}$/.test(line) && !/\b(?:applicants?|followers?|contract|easy apply|on-site|onsite|remote|hybrid|job poster)\b/i.test(line)
  })

  return {
    company: companyHint && !isWeak(companyHint, ['unknown', 'not verifiable', 'not specified'])
      ? companyHint
      : companyFromLine ? cleanCompany(companyFromLine) : undefined,
    role: roleFromLine || roleFromText || undefined,
    location: locationFromText || undefined,
    applicationPath: /easy apply/i.test(source) ? 'LinkedIn Easy Apply' : undefined,
    recruiterName: recruiterName ? titleCase(recruiterName) : undefined,
  }
}

function isSuspiciousPhone(value, input) {
  const phone = String(value || '').trim()
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return true
  if (!/[+() -]/.test(phone) && digits.length >= 8) return true
  const url = String(input?.url || '')
  if (digits && url.includes(digits)) return true
  if (new RegExp(`(?:job\\s*id|jobPosting/)\\s*${escapeRegExp(digits)}`, 'i').test(String(input?.text || ''))) return true
  return false
}

export function recoverObviousClaims(input, claims) {
  const text = String(input?.text || '')
  const recovered = { ...claims }
  const linkedInClaims = extractLinkedInPageClaims(text, recovered)

  if (recovered.company) {
    recovered.company = cleanCompany(recovered.company)
  }

  if (recovered.role) {
    const cleanedRole = cleanRole(recovered.role)
    recovered.role = cleanedRole || ''
  }

  const company = extractCompany(text, input?.url)
  if (company && isWeak(recovered.company, ['unknown', 'not verifiable', 'not specified'])) {
    recovered.company = company
  }
  if (linkedInClaims.company && isWeak(recovered.company, ['unknown', 'not verifiable', 'not specified'])) {
    recovered.company = linkedInClaims.company
  }

  const role = extractRole(text)
  if (role && isWeak(recovered.role, ['unspecified', 'unknown', 'not specified', ' at '])) {
    recovered.role = cleanRole(role) || role
  }
  if (linkedInClaims.role && isWeak(recovered.role, ['unspecified', 'unknown', 'not specified', ' at '])) {
    recovered.role = linkedInClaims.role
  }

  const salary = extractSalary(text)
  if (salary && isWeak(recovered.salary, ['not specified', 'unknown'])) {
    recovered.salary = salary
  }

  const contactMethod = extractContactMethod(text)
  if (contactMethod && isWeak(recovered.contactMethod, ['not specified', 'unknown'])) {
    recovered.contactMethod = contactMethod
  }

  const applicationPath = extractApplicationPath(text, input?.url)
  if (applicationPath && (
    isWeak(recovered.applicationPath, ['not specified', 'unknown']) ||
    (/^direct message$/i.test(recovered.applicationPath) && /linkedin|greenhouse|lever|ashby|smartrecruiters|workday/i.test(applicationPath))
    || (/linkedin job page/i.test(recovered.applicationPath) && /easy apply/i.test(applicationPath))
  )) {
    recovered.applicationPath = applicationPath
  }
  if (linkedInClaims.applicationPath && /linkedin/i.test(recovered.applicationPath || '')) {
    recovered.applicationPath = linkedInClaims.applicationPath
  }

  if (input?.location && isWeak(recovered.location, ['not specified', 'unknown'])) {
    recovered.location = input.location
  }
  const location = linkedInClaims.location || extractLocation(text)
  if (location && isWeak(recovered.location, ['not specified', 'unknown'])) {
    recovered.location = location
  }

  const recruiterName = linkedInClaims.recruiterName || extractRecruiterName(text)
  if (recruiterName && isWeak(recovered.recruiterName, ['not specified', 'unknown'])) {
    recovered.recruiterName = titleCase(recruiterName)
  }

  const recruiterEmail = extractRecruiterEmail(text)
  if (recruiterEmail && isWeak(recovered.recruiterEmail, ['not specified', 'unknown'])) {
    recovered.recruiterEmail = recruiterEmail
  }

  const recruiterProfile = extractRecruiterProfile(text)
  if (recruiterProfile && isWeak(recovered.recruiterProfile, ['not specified', 'unknown'])) {
    recovered.recruiterProfile = recruiterProfile
  }

  const recruiterPhone = extractRecruiterPhone(text)
  if (recruiterPhone && isWeak(recovered.recruiterPhone, ['not specified', 'unknown'])) {
    recovered.recruiterPhone = recruiterPhone.replace(/^(?:phone|mobile|tel|call|contact number)\s*[:\-]?\s*/i, '').trim()
  }

  if (isSuspiciousPhone(recovered.recruiterPhone, input)) {
    delete recovered.recruiterPhone
  }

  return recovered
}

function extractFirstMatch(text, patterns, fallback = 'Unknown') {
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern)
    const value = match?.[1]?.trim().replace(/[.。]+$/, '')
    if (value) return value
  }
  return fallback
}

function extractCompanyFromUrl(url) {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const [name] = hostname.split('.')
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : null
  } catch {
    return null
  }
}

/**
 * Deterministic, model-free extraction of structured claims from a raw job post.
 * This is the single source of truth for the audit route's `useModel:false` path and the
 * real-text eval harness — keep them one and the same so extraction can be measured end-to-end.
 * @param {{ text?: string, url?: string, location?: string }} input
 */
export function extractClaimsFromText(input) {
  const text = String(input?.text || '')

  const companyFromUrl = extractCompanyFromUrl(input?.url || undefined)
  const company = companyFromUrl || extractFirstMatch(text, [
    /(?:company|employer)\s*[:\-]\s*([A-Za-z0-9&,' -]{2,70}?)(?=\s*(?:[.;\n\r]|role|position|job title|salary|location|contact|apply)\s*[:\-]?|$)/i,
    /(?:at|from|with)\s+([A-Z][A-Za-z0-9&.,' -]{2,70})(?:\s+(?:is|for|as|hiring|offers|seeks)|[.,\n]|$)/,
  ], 'Unknown / Not Verifiable')

  const rawRole = extractFirstMatch(text, [
    /(?:role|position|job title)\s*[:\-]\s*([A-Za-z /+-]{2,70})/i,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Za-z /+-]{2,70})(?:\s+(?:at|for|in|with)|[.,\n]|$)/i,
    /\b((?:frontend|front-end|backend|back-end|full stack|software|web|ui\/ux|data|virtual assistant|customer support)[A-Za-z /+-]{0,40}(?:engineer|developer|intern|designer|analyst|assistant|specialist|representative)?)\b/i,
  ], 'Unspecified role')
  const role = rawRole.replace(/\s+(?:at|for|with|in)\s+.*$/i, '').trim()

  const salary = extractFirstMatch(text, [
    /((?:PHP|Php|php|USD|usd|₱|\$)\s*[\d,.]+(?:\s*[-–]\s*(?:PHP|Php|php|USD|usd|₱|\$)?\s*[\d,.]+)?(?:\s*(?:\/|per)?\s*(?:week|month|year|hour|annum|annually))?)/i,
    /([\d,.]+\s*(?:PHP|Php|php|USD|usd|pesos|dollars)\s*(?:\/|per)?\s*(?:week|month|year|hour)?)/i,
  ], 'Not specified')

  const lower = text.toLowerCase()
  const contactMethod = lower.includes('telegram')
    ? 'Telegram'
    : lower.includes('whatsapp')
      ? 'WhatsApp'
      : lower.includes('linkedin')
        ? 'LinkedIn'
        : lower.includes('email')
          ? 'Email'
          : 'Not specified'

  const applicationPath = lower.includes('no interview')
    ? 'No interview mentioned'
    : lower.includes('direct message') || lower.includes('dm ')
      ? 'Direct message'
      : input?.url
        ? 'Provided job URL'
        : lower.includes('official') || lower.includes('careers')
          ? 'Official careers channel'
          : 'Not specified'

  return recoverObviousClaims(input, {
    company,
    role,
    salary,
    location: input?.location || 'Not specified',
    contactMethod,
    applicationPath,
  })
}
