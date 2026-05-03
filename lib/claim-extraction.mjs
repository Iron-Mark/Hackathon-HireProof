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
    .replace(/\s+\b(?:followers?|connections?)\b.*$/i, '')
    .replace(/\s+\b(?:promoted|actively hiring)\b.*$/i, ''))
}

function cleanRole(value) {
  const cleaned = cleanMatch(value)
    .replace(/^\s*at\s+[A-Z][A-Za-z0-9&' -]{2,80}$/i, '')
    .replace(/\s+\bat\s+[A-Z][A-Za-z0-9&' -]{2,80}$/i, '')
    .trim()
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

function extractRole(text) {
  const explicit = firstMatch(text, [
    /(?:role|position|job title)\s*[:\-]\s*([A-Za-z][A-Za-z /+-]{2,80})/i,
    /\b(?:remote|onsite|hybrid)?\s*((?:online|frontend|front-end|backend|back-end|full stack|software|web|ui\/ux|data|security|virtual assistant|customer support)[A-Za-z /+-]{0,50}(?:engineer|developer|intern|designer|analyst|assistant|specialist|representative))\b/i,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Za-z][A-Za-z /+-]{2,80})(?:\s+(?:at|for|in|with)|[.,\n]|$)/i,
  ])

  return explicit ? titleCase(explicit.replace(/\s+(?:at|for|with|in)\s+.*$/i, '')) : null
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
  if (lower.includes('direct message') || lower.includes('dm ') || lower.includes('message ') || lower.includes('telegram only')) return 'Direct message'
  if (url) return 'Provided job URL'
  if (lower.includes('official') || lower.includes('careers')) return 'Official careers channel'
  return null
}

function extractRecruiterName(text) {
  return firstMatch(text, [
    /(?:recruiter|hiring manager|contact person|contact)\s*[:\-]\s*([A-Za-z][A-Za-z .' -]{2,80}?)(?=\s*(?:[.;\n\r]|email|phone|linkedin|profile|apply)\s*[:\-]?|$)/i,
    /(?:message|contact|email)\s+([A-Z][A-Za-z .' -]{2,80})\s+(?:at|via|on|for)/,
  ])
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
  const match = String(text || '').match(/(?:\+?\d[\d ()-]{7,}\d)/)
  return match?.[0]?.trim() || null
}

export function recoverObviousClaims(input, claims) {
  const text = String(input?.text || '')
  const recovered = { ...claims }

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

  const role = extractRole(text)
  if (role && isWeak(recovered.role, ['unspecified', 'unknown', 'not specified', ' at '])) {
    recovered.role = cleanRole(role) || role
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
  if (applicationPath && isWeak(recovered.applicationPath, ['not specified', 'unknown'])) {
    recovered.applicationPath = applicationPath
  }

  if (input?.location && isWeak(recovered.location, ['not specified', 'unknown'])) {
    recovered.location = input.location
  }

  const recruiterName = extractRecruiterName(text)
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
    recovered.recruiterPhone = recruiterPhone
  }

  return recovered
}
