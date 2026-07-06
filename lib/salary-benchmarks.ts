import type { SalaryBenchmarkSource } from '@/lib/schemas'

type Seniority = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'unknown'

type BenchmarkInput = {
  role: string
  location: string
  seniority: Seniority
  liveComparableMonthlyValues?: number[]
}

export type SalaryBenchmark = {
  source: SalaryBenchmarkSource
  country: string
  currency: string
  monthlyLow?: number
  monthlyHigh?: number
  comparableMonthlyAmount?: number
  seniority: Seniority
}

const COUNTRY_CONFIG = {
  PH: { currency: 'PHP', multiplier: 1 },
  US: { currency: 'USD', multiplier: 1 },
  UK: { currency: 'GBP', multiplier: 1 },
  CA: { currency: 'CAD', multiplier: 1 },
  REMOTE: { currency: 'USD', multiplier: 1 },
} as const

const ROLE_BASE: Record<string, Record<keyof typeof COUNTRY_CONFIG, number>> = {
  engineering: { PH: 90000, US: 9500, UK: 6500, CA: 8000, REMOTE: 8500 },
  design: { PH: 70000, US: 8000, UK: 5200, CA: 6800, REMOTE: 7000 },
  data: { PH: 85000, US: 9000, UK: 6000, CA: 7600, REMOTE: 8000 },
  support: { PH: 40000, US: 4500, UK: 3200, CA: 3800, REMOTE: 4200 },
  general: { PH: 60000, US: 6500, UK: 4500, CA: 5400, REMOTE: 6000 },
}

const SENIORITY_MULTIPLIER: Record<Seniority, number> = {
  intern: 0.35,
  junior: 0.65,
  mid: 1,
  senior: 1.55,
  lead: 1.9,
  unknown: 1,
}

function normalizeText(value: string) {
  return String(value || '').toLowerCase()
}

function inferCountry(location: string): keyof typeof COUNTRY_CONFIG {
  const text = normalizeText(location)
  if (/\b(ph|philippines|manila|makati|cebu|davao|taguig|pasig|quezon|iloilo|bacolod|baguio|caloocan|pasay|paranaque|mandaluyong|zamboanga|cagayan)\b/.test(text)) return 'PH'
  if (/\b(uk|united kingdom|london|england|scotland)\b/.test(text)) return 'UK'
  if (/\b(canada|toronto|vancouver|montreal)\b/.test(text)) return 'CA'
  if (/\b(remote|global|worldwide|anywhere)\b/.test(text)) return 'REMOTE'
  return 'US'
}

function inferRoleFamily(role: string): keyof typeof ROLE_BASE {
  const text = normalizeText(role)
  if (/\b(frontend|front-end|backend|back-end|full stack|software|developer|engineer|devops|security)\b/.test(text)) return 'engineering'
  if (/\b(design|designer|ui|ux|product design)\b/.test(text)) return 'design'
  if (/\b(data|analytics|analyst|machine learning|ai)\b/.test(text)) return 'data'
  if (/\b(support|assistant|customer|representative|service)\b/.test(text)) return 'support'
  return 'general'
}

function median(values: number[]) {
  const sorted = values.filter(value => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return undefined
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle]
}

export function getSeededSalaryBenchmark(input: BenchmarkInput): SalaryBenchmark {
  const country = inferCountry(input.location)
  const family = inferRoleFamily(input.role)
  const seniority = input.seniority || 'unknown'
  const midpoint = Math.round(ROLE_BASE[family][country] * SENIORITY_MULTIPLIER[seniority])
  const monthlyLow = Math.round(midpoint * 0.75)
  const monthlyHigh = Math.round(midpoint * 1.25)

  return {
    source: 'seeded-country-band',
    country,
    currency: COUNTRY_CONFIG[country].currency,
    monthlyLow,
    monthlyHigh,
    comparableMonthlyAmount: midpoint,
    seniority,
  }
}

export function buildHybridSalaryBenchmark(input: BenchmarkInput): SalaryBenchmark {
  const liveMedian = median(input.liveComparableMonthlyValues || [])
  const country = inferCountry(input.location)
  const seeded = getSeededSalaryBenchmark(input)

  if (typeof liveMedian === 'number' && (input.liveComparableMonthlyValues || []).length >= 2) {
    return {
      source: 'serpapi-live-comparables',
      country,
      currency: seeded.currency,
      comparableMonthlyAmount: liveMedian,
      seniority: input.seniority,
    }
  }

  return seeded
}
