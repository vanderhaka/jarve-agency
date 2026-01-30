export interface City {
  slug: string
  name: string
  state: string
  tier: 1 | 2
  keywords: string[]
  localDetails: string
}

export interface Service {
  slug: string
  name: string
  description: string
  priceRange: string
  timeline: string
  keyFeatures: string[]
  typicalClient: string
  keywords: string[]
}

export interface Industry {
  slug: string
  name: string
  painPoints: string[]
  keywords: string[]
}

export interface Solution {
  slug: string
  problem: string
  description: string
  keywords: string[]
}

export interface Comparison {
  slug: string
  tool: string
  category: string
  keywords: string[]
}

export type RoutePattern =
  | 'services-city'
  | 'industries'
  | 'industries-city'
  | 'solutions'
  | 'comparisons'

export interface SeoPage {
  id: string
  route_pattern: RoutePattern
  slug: string
  status: 'draft' | 'published'
  content: Record<string, unknown>
  meta_title: string
  meta_description: string
  created_at: string
  updated_at: string
}

export interface SeoContent {
  heroHeadline: string
  heroSubheadline: string
  cityContext?: string
  problemStatement: string
  solution: string
  benefits: {
    title: string
    description: string
  }[]
  localSignals?: string[]
  ctaText: string
  faq: {
    question: string
    answer: string
  }[]
  layout?: 'standard' | 'problem-first' | 'faq-heavy' | 'benefits-grid' | 'story-flow'
  testimonialMatch?: string
  metaDescription?: string
}
