export interface ScamFaq {
  question: string
  answer: string
}

export interface ScamPattern {
  slug: string
  name: string
  aka: string[]
  searchTitle: string
  metaDescription: string
  summary: string
  howItWorks: string[]
  redFlags: string[]
  whatToDo: string[]
  faq: ScamFaq[]
  relatedSlugs: string[]
}

export const SCAM_PATTERNS: ScamPattern[]
export function getScamPattern(slug: string): ScamPattern | undefined
export function scamPatternSlugs(): string[]
