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
    .replace(/\s+(?:role|position|job title|salary|location|contact|apply)\s*[:\-].*$/i, '')
    .replace(/[.。]+$/, '')
    .replace(/\s+/g, ' ')
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
    /\b(?:remote|onsite|hybrid)?\s*((?:frontend|front-end|backend|back-end|full stack|software|web|ui\/ux|data|security|virtual assistant|customer support)[A-Za-z /+-]{0,50}(?:engineer|developer|intern|designer|analyst|assistant|specialist|representative))\b/i,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Za-z][A-Za-z /+-]{2,80})(?:\s+(?:at|for|in|with)|[.,\n]|$)/i,
  ])

  return explicit ? titleCase(explicit.replace(/\s+(?:at|for|with|in)\s+.*$/i, '')) : null
}

function extractCompany(text, url) {
  const fromText = firstMatch(text, [
    /(?:company|employer)\s*[:\-]\s*([A-Za-z0-9&,' -]{2,70}?)(?=\s*(?:[.;\n\r]|role|position|job title|salary|location|contact|apply)\s*[:\-]?|$)/i,
    /(?:at|from|with)\s+([A-Z][A-Za-z0-9&' -]{2,70})(?:\s+(?:is|for|as|hiring|offers|seeks)|[.,\n]|$)/,
  ])

  if (fromText) return titleCase(fromText)

  if (!url) return null
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const [name] = hostname.split('.')
    return name ? titleCase(name) : null
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

export function recoverObviousClaims(input, claims) {
  const text = String(input?.text || '')
  const recovered = { ...claims }

  const company = extractCompany(text, input?.url)
  if (company && isWeak(recovered.company, ['unknown', 'not verifiable', 'not specified'])) {
    recovered.company = company
  }

  const role = extractRole(text)
  if (role && isWeak(recovered.role, ['unspecified', 'unknown', 'not specified'])) {
    recovered.role = role
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

  return recovered
}
