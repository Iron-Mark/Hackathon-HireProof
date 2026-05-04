const GENERIC_COMPANY_TERMS = new Set([
  'the',
  'and',
  'company',
  'corp',
  'corporation',
  'inc',
  'llc',
  'ltd',
  'limited',
  'co',
  'group',
])

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasAny(value, terms) {
  const text = normalize(value)
  return terms.some((term) => text.includes(term))
}

function companyTokens(companyName) {
  return normalize(companyName)
    .split(' ')
    .filter((token) => token.length >= 3 && !GENERIC_COMPANY_TERMS.has(token))
}

function isUnknown(value) {
  const text = normalize(value)
  return !text || text.includes('unknown') || text.includes('not verifiable') || text.includes('not specified')
}

function evidenceText(item) {
  return `${item?.type || ''} ${item?.source || ''} ${item?.snippet || ''} ${item?.url || ''}`
}

function sourceTier(item) {
  const text = normalize(evidenceText(item))
  if (
    text.includes('official company presence') ||
    text.includes('trust official') ||
    text.includes('verified local presence') ||
    text.includes('verified local')
  ) return 'official'

  if (
    text.includes('linkedin') ||
    text.includes('greenhouse') ||
    text.includes('lever') ||
    text.includes('ashby') ||
    text.includes('smartrecruiters') ||
    text.includes('workday') ||
    text.includes('indeed') ||
    text.includes('glassdoor') ||
    text.includes('jobstreet') ||
    text.includes('reputable job board')
  ) return 'reputable_job_board'

  if (text.includes('company check') || text.includes('web search') || text.includes('public job page')) return 'public_web'
  if (text.includes('directory') || text.includes('mirror') || text.includes('scraped')) return 'weak_directory'
  return 'user_claim_only'
}

function signal(id, category, direction, severity, confidence, weight, explanation, evidenceType) {
  return {
    id,
    category,
    direction,
    severity,
    confidence,
    weight,
    explanation,
    evidenceType,
  }
}

function addUnique(output, item) {
  if (output.some((existing) => existing.id === item.id && existing.explanation === item.explanation)) return
  output.push(item)
}

function buildContactSignals(claims, output) {
  const contact = normalize(claims?.contactMethod)
  const appPath = normalize(claims?.applicationPath)
  const combined = `${contact} ${appPath}`

  if (combined.includes('telegram')) {
    addUnique(output, signal(
      'contact.telegram_only',
      'contact',
      'risk',
      'high',
      'high',
      20,
      'Recruitment is pushed to Telegram, which bypasses normal company-controlled hiring channels.',
      'Contact Safety',
    ))
  }

  if (combined.includes('whatsapp')) {
    addUnique(output, signal(
      'contact.whatsapp_only',
      'contact',
      'risk',
      'medium',
      'high',
      17,
      'Recruitment is pushed to WhatsApp, which is weaker than a company-owned or job-board apply path.',
      'Contact Safety',
    ))
  }

  if (hasAny(combined, ['linkedin', 'official', 'careers', 'easy apply', 'provided job url'])) {
    addUnique(output, signal(
      'contact.professional_apply_path',
      'contact',
      'trust',
      'medium',
      'medium',
      -8,
      'The application path uses a recognizable job board, official channel, or public job URL.',
      'Apply Path',
    ))
  }
}

function buildProcessSignals(claims, output) {
  const appPath = normalize(claims?.applicationPath)
  if (appPath.includes('no interview')) {
    addUnique(output, signal(
      'process.no_interview',
      'process',
      'risk',
      'high',
      'high',
      18,
      'The hiring flow mentions no interview, which is unusual for legitimate employment.',
      'Recruitment Process',
    ))
  }
}

function buildSalarySignals(claims, output) {
  const salary = normalize(claims?.salary)
  const role = normalize(claims?.role)
  if (!salary) return

  const highWeekly = /(?:80\s*000|80000|100\s*000|100000)/.test(salary) && salary.includes('week')
  const weekly = salary.includes('week')
  const internship = role.includes('intern') || role.includes('entry')

  if (highWeekly || (weekly && internship)) {
    addUnique(output, signal(
      'salary.implausible_weekly_entry_role',
      'salary',
      'risk',
      'high',
      'high',
      30,
      'The salary format and role level look implausible for a normal hiring process.',
      'Market Plausibility',
    ))
    return
  }

  if (weekly) {
    addUnique(output, signal(
      'salary.weekly_quote',
      'salary',
      'risk',
      'medium',
      'medium',
      12,
      'Salary is quoted weekly, which needs extra verification against market norms.',
      'Market Plausibility',
    ))
  }

  if (hasAny(salary, ['per year', 'annually', 'per month', 'per hour', 'hour'])) {
    addUnique(output, signal(
      'salary.standard_format',
      'salary',
      'trust',
      'low',
      'medium',
      -4,
      'The compensation format is a recognizable market format.',
      'Market Plausibility',
    ))
  }
}

function buildClaimCompletenessSignals(claims, output) {
  if (isUnknown(claims?.company)) {
    addUnique(output, signal(
      'entity.company_unknown',
      'entity',
      'risk',
      'medium',
      'high',
      14,
      'The company name is missing or not verifiable from the submitted post.',
      'Company Verification',
    ))
  }

  if (!isUnknown(claims?.location)) {
    addUnique(output, signal(
      'entity.location_specific',
      'entity',
      'trust',
      'low',
      'medium',
      -3,
      'The post includes a specific location or remote market context.',
      'Job Detail Quality',
    ))
  }
}

function buildContractorSignals(claims, evidence, output) {
  const safeEvidence = Array.isArray(evidence) ? evidence : []
  const combined = normalize([
    claims?.role,
    claims?.salary,
    claims?.location,
    claims?.contactMethod,
    claims?.applicationPath,
    ...safeEvidence.map(evidenceText),
  ].join(' '))

  const contractorTerms = [
    '1099',
    'independent contractor',
    'contractor role',
    'contract role',
    'project based',
    'project dependent',
    'hours vary',
    'not guaranteed',
    'no guaranteed hours',
    'weekly via paypal',
    'weekly via stripe',
  ]
  const transparentCaveats = [
    'accepted countries',
    'accepted locations',
    'unable to process applications from unlisted locations',
    'not compatible with f 1 opt',
    'stem opt',
    'w 2 employment',
    'employer sponsorship',
    'unable to provide offer letters',
    'employment verification',
    'identity verification',
    'valid documentation',
  ]
  const aiTrainingTerms = [
    'rlhf',
    'large language models',
    'llms',
    'rank multiple code snippets',
    'ai generated code',
    'reward signals',
    'model learns',
    'code review',
  ]

  const hasContractorDisclosure = hasAny(combined, contractorTerms)
  const hasTransparentCaveats = hasAny(combined, transparentCaveats)
  const hasAiTrainingContext = hasAny(combined, aiTrainingTerms)

  if (hasContractorDisclosure) {
    addUnique(output, signal(
      'contractor.variable_hours_caution',
      'process',
      'risk',
      'medium',
      'high',
      12,
      'The role is disclosed as contractor or project-dependent work, so it should not be treated as stable employment.',
      'Contract Terms',
    ))
  }

  if (hasTransparentCaveats) {
    addUnique(output, signal(
      'contractor.transparent_limitations',
      'process',
      'trust',
      'medium',
      'high',
      -7,
      'The listing clearly discloses eligibility, visa, identity, employment-verification, or hours limitations.',
      'Contract Transparency',
    ))
  }

  if (hasAiTrainingContext) {
    addUnique(output, signal(
      'role.rlhf_ai_training_context',
      'entity',
      'trust',
      'low',
      'medium',
      -3,
      'The role description matches a recognizable AI training or RLHF coding-review work pattern.',
      'Role Plausibility',
    ))
  }
}

function buildEvidenceSignals(claims, evidence, output) {
  const safeEvidence = Array.isArray(evidence) ? evidence : []
  const tiers = new Set(safeEvidence.map(sourceTier))
  const company = claims?.company || ''
  const tokens = companyTokens(company)

  if (tiers.has('official')) {
    addUnique(output, signal(
      'source.official_match',
      'source',
      'trust',
      'high',
      'high',
      -16,
      'Evidence includes official or verified company presence.',
      'Official Company Presence',
    ))
  }

  if (tiers.has('reputable_job_board')) {
    addUnique(output, signal(
      'source.reputable_job_board',
      'source',
      'trust',
      'medium',
      'high',
      -8,
      'Evidence includes a reputable job board or known ATS source.',
      'Job Post Source',
    ))
  }

  if (tiers.has('weak_directory')) {
    addUnique(output, signal(
      'source.weak_directory',
      'source',
      'risk',
      'low',
      'medium',
      6,
      'Some evidence comes from weak directory or mirrored job sources.',
      'Source Reliability',
    ))
  }

  if (safeEvidence.length === 0) {
    addUnique(output, signal(
      'evidence.none',
      'evidence',
      'risk',
      'medium',
      'high',
      10,
      'No external supporting evidence was available for the audit.',
      'Evidence Coverage',
    ))
  }

  for (const item of safeEvidence) {
    const text = normalize(evidenceText(item))
    const type = normalize(item?.type)
    const source = normalize(item?.source)
    const sourceType = normalize(item?.sourceType)
    const trustLevel = normalize(item?.trustLevel)

    if (sourceType === 'domain' && type.includes('domain age') && trustLevel === 'risk') {
      addUnique(output, signal(
        'domain.newly_registered',
        'source',
        'risk',
        'medium',
        'high',
        16,
        'The hiring or apply domain appears newly registered, which increases impersonation risk.',
        item?.type || 'Domain Age',
      ))
    }

    if (sourceType === 'domain' && type.includes('recruiter domain') && trustLevel === 'risk') {
      addUnique(output, signal(
        'domain.recruiter_mismatch',
        'contact',
        'risk',
        'high',
        'high',
        18,
        'The recruiter contact domain does not match the verified company or apply domain.',
        item?.type || 'Recruiter Domain Check',
      ))
    }

    if (sourceType === 'threat intel' && trustLevel === 'risk') {
      addUnique(output, signal(
        'threat.known_bad_url',
        'evidence',
        'risk',
        'high',
        'high',
        26,
        'A submitted URL matched known phishing, malware, social-engineering, or abuse intelligence.',
        item?.type || 'Known Threat Check',
      ))
    }

    if (sourceType === 'domain' && type.includes('domain mismatch') && trustLevel !== 'risk' && /\b(match|matches|official)\b/.test(text)) {
      addUnique(output, signal(
        'domain.apply_official',
        'source',
        'trust',
        'medium',
        'high',
        -10,
        'The submitted apply domain matches the verified company or official hiring domain.',
        item?.type || 'Apply Domain Check',
      ))
    }

    if (type.includes('screenshot ocr unavailable')) {
      addUnique(output, signal(
        'screenshot.ocr_unavailable',
        'evidence',
        'risk',
        'low',
        'high',
        8,
        'Screenshot text could not be extracted, so image-only audit confidence is lower.',
        'Screenshot OCR',
      ))
    }

    if (type.includes('screenshot ocr') && !type.includes('unavailable')) {
      const usedGoogleVision = source.includes('google vision')
      addUnique(output, signal(
        usedGoogleVision ? 'screenshot.ocr_google_vision' : 'screenshot.ocr_fallback',
        'evidence',
        'trust',
        'low',
        usedGoogleVision ? 'high' : 'medium',
        usedGoogleVision ? -4 : -2,
        usedGoogleVision
          ? 'Screenshot text was extracted with Google Vision OCR and included in the audit.'
          : 'Screenshot text was extracted with fallback OCR and included in the audit.',
        'Screenshot OCR',
      ))
    }

    if (type.includes('apply path mismatch')) {
      addUnique(output, signal(
        'entity.apply_path_mismatch',
        'entity',
        'risk',
        'high',
        'high',
        18,
        'The submitted application path does not match the expected official or reputable apply path.',
        'Apply Path Mismatch',
      ))
    }

    if (type.includes('domain age') && /\b(newly registered|very new|registered 2026|registered 2027)\b/.test(text)) {
      addUnique(output, signal(
        'domain.newly_registered',
        'entity',
        'risk',
        'high',
        'high',
        18,
        'The apply, recruiter, or linked domain appears newly registered and needs stronger verification.',
        'Domain Age',
      ))
    }

    if (type.includes('domain age') && !text.includes('risk signal') && /\bregistered\b/.test(text)) {
      addUnique(output, signal(
        'domain.established_registration',
        'entity',
        'trust',
        'low',
        'medium',
        -4,
        'Domain registry evidence exists for the submitted domain, but age alone does not prove the job is safe.',
        'Domain Age',
      ))
    }

    if (type.includes('domain mismatch')) {
      const isTrust = text.includes('trust signal') || text.includes('matches the official') || text.includes('recognized job board')
      addUnique(output, signal(
        isTrust ? 'domain.apply_official' : 'domain.apply_mismatch',
        'entity',
        isTrust ? 'trust' : 'risk',
        isTrust ? 'medium' : 'high',
        'high',
        isTrust ? -10 : 20,
        isTrust
          ? 'The submitted apply domain matches the official company root or a recognized job board/ATS.'
          : 'The submitted apply domain does not match the expected official company or reputable apply path.',
        'Domain Mismatch',
      ))
    }

    if (type.includes('recruiter domain check')) {
      const isTrust = text.includes('trust signal') || text.includes('matches official')
      const freeMail = text.includes('free mail') || text.includes('free-mail')
      addUnique(output, signal(
        isTrust ? 'domain.recruiter_official' : freeMail ? 'domain.recruiter_free_mail' : 'domain.recruiter_mismatch',
        'entity',
        isTrust ? 'trust' : 'risk',
        isTrust ? 'medium' : freeMail ? 'medium' : 'high',
        'high',
        isTrust ? -8 : freeMail ? 12 : 18,
        isTrust
          ? 'The recruiter email domain matches the official company root.'
          : freeMail
            ? 'The recruiter uses a free-mail address instead of a company-controlled domain.'
            : 'The recruiter email domain does not match the official company root.',
        'Recruiter Domain Check',
      ))
    }

    if (type.includes('dns liveness') && text.includes('mail records no')) {
      addUnique(output, signal(
        'domain.no_custom_mail_dns',
        'entity',
        'risk',
        'medium',
        'medium',
        8,
        'The checked domain did not show mail DNS records, which weakens recruiter-domain trust for custom email claims.',
        'DNS Liveness',
      ))
    }

    if (type.includes('certificate transparency') && /\b(very recent|new certificate|risk signal)\b/.test(text)) {
      addUnique(output, signal(
        'domain.recent_certificate',
        'entity',
        'risk',
        'medium',
        'medium',
        10,
        'Certificate transparency evidence shows very recent certificate activity for a submitted domain.',
        'Certificate Transparency',
      ))
    }

    if (type.includes('known phishing check') && /\b(risk signal|known|phishing|malware|social engineering|urlhaus|phishtank)\b/.test(text)) {
      addUnique(output, signal(
        'threat.known_bad_url',
        'evidence',
        'risk',
        'high',
        'high',
        35,
        'A submitted URL or domain matched a known phishing, malware, or social-engineering intelligence source.',
        'Known Phishing Check',
      ))
    }

    if (type.includes('company registry') && /\b(active|registry match)\b/.test(text) && !text.includes('inactive')) {
      addUnique(output, signal(
        'registry.active_company_match',
        'entity',
        'trust',
        'medium',
        'medium',
        -8,
        'Company registry evidence contains an active company match, but it should still be compared against the job domain and recruiter path.',
        'Company Registry',
      ))
    }

    if (type.includes('input conflict')) {
      addUnique(output, signal(
        'entity.input_conflict',
        'entity',
        'risk',
        'medium',
        'high',
        16,
        'The submitted text conflicts with the resolved public job page.',
        'Input Conflict',
      ))
    }

    if (/\b(risk signal|scam|fraud|fake|impersonat|phishing|mismatch|lawsuit|warning)\b/.test(text)) {
      addUnique(output, signal(
        'evidence.negative_reputation',
        'evidence',
        'risk',
        'high',
        'medium',
        14,
        'External evidence contains scam, fraud, fake, impersonation, warning, or mismatch language.',
        item?.type || 'Reputation',
      ))
    }

    if (tokens.length > 0 && tokens.some((token) => text.includes(token)) && type.includes('company')) {
      addUnique(output, signal(
        'entity.company_evidence_match',
        'entity',
        'trust',
        'medium',
        'medium',
        -5,
        'Company evidence contains tokens matching the extracted company.',
        item?.type || 'Company Check',
      ))
    }
  }
}

function buildLegacyFlagSignals(redFlags, greenFlags, output) {
  for (const flag of Array.isArray(redFlags) ? redFlags : []) {
    const text = normalize(flag)
    if (!text) continue

    let weight = 8
    let severity = 'medium'
    if (hasAny(text, ['payment', 'fee', 'unrealistic'])) {
      weight = 24
      severity = 'high'
    } else if (hasAny(text, ['telegram', 'whatsapp', 'interview', 'company', 'mismatch'])) {
      weight = 14
    }

    addUnique(output, signal(
      `legacy.risk.${text.slice(0, 48).replace(/\s+/g, '_')}`,
      'integrity',
      'risk',
      severity,
      'medium',
      weight,
      String(flag),
      'Risk Flag',
    ))
  }

  for (const flag of Array.isArray(greenFlags) ? greenFlags : []) {
    const text = normalize(flag)
    if (!text) continue

    let weight = -5
    if (hasAny(text, ['verified', 'official', 'professional', 'legitimate'])) weight = -9

    addUnique(output, signal(
      `legacy.trust.${text.slice(0, 48).replace(/\s+/g, '_')}`,
      'integrity',
      'trust',
      'low',
      'medium',
      weight,
      String(flag),
      'Trust Flag',
    ))
  }
}

export function buildAuditSignals(extractedClaims, redFlags = [], greenFlags = [], evidence = []) {
  const output = []
  buildContactSignals(extractedClaims, output)
  buildProcessSignals(extractedClaims, output)
  buildSalarySignals(extractedClaims, output)
  buildClaimCompletenessSignals(extractedClaims, output)
  buildContractorSignals(extractedClaims, evidence, output)
  buildEvidenceSignals(extractedClaims, evidence, output)
  buildLegacyFlagSignals(redFlags, greenFlags, output)
  return output
}

export function scoreAuditSignals(signals, evidence = []) {
  const safeSignals = Array.isArray(signals) ? signals : []
  let score = 25 + safeSignals.reduce((total, item) => total + Number(item.weight || 0), 0)
  const ids = new Set(safeSignals.map((item) => item.id))
  const evidenceCount = Array.isArray(evidence) ? evidence.length : 0

  const hasCriticalScamPattern = (
    ids.has('salary.implausible_weekly_entry_role') &&
    (ids.has('contact.telegram_only') || ids.has('contact.whatsapp_only')) &&
    ids.has('process.no_interview')
  )

  if (hasCriticalScamPattern) score = Math.max(score, 80)
  if ((ids.has('contact.telegram_only') || ids.has('contact.whatsapp_only')) && ids.has('process.no_interview')) score = Math.max(score, 65)
  if (ids.has('entity.apply_path_mismatch') || ids.has('entity.input_conflict')) score = Math.max(score, 45)
  if (ids.has('entity.company_unknown') && evidenceCount < 2) score = Math.max(score, 40)
  if (ids.has('contractor.variable_hours_caution')) score = Math.max(score, 35)

  if (
    ids.has('source.official_match') &&
    ids.has('contact.professional_apply_path') &&
    !ids.has('entity.apply_path_mismatch') &&
    !ids.has('entity.input_conflict') &&
    !ids.has('evidence.negative_reputation') &&
    !ids.has('contact.telegram_only') &&
    !ids.has('contact.whatsapp_only') &&
    !ids.has('contractor.variable_hours_caution')
  ) {
    score = Math.min(score, 30)
  } else if (
    ids.has('source.reputable_job_board') &&
    ids.has('contact.professional_apply_path') &&
    !ids.has('entity.apply_path_mismatch') &&
    !ids.has('entity.input_conflict') &&
    !ids.has('contractor.variable_hours_caution')
  ) {
    score = Math.min(score, 45)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function strongestRiskSignals(signals, limit = 3) {
  return (Array.isArray(signals) ? signals : [])
    .filter((item) => item.direction === 'risk')
    .sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))
    .slice(0, limit)
}

export function strongestTrustSignals(signals, limit = 3) {
  return (Array.isArray(signals) ? signals : [])
    .filter((item) => item.direction === 'trust')
    .sort((a, b) => Number(a.weight || 0) - Number(b.weight || 0))
    .slice(0, limit)
}
