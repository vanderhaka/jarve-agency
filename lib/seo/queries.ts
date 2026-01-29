import { createAnonClient } from '@/utils/supabase/anon'
import type { SeoPage, SeoContent } from './types'

const supabase = createAnonClient()

export async function getPublishedPage(slug: string): Promise<SeoPage | null> {
  const { data } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data as SeoPage | null
}

export async function getPublishedSlugs(routePattern: string): Promise<string[]> {
  const { data } = await supabase
    .from('seo_pages')
    .select('slug')
    .eq('route_pattern', routePattern)
    .eq('status', 'published')
  return (data ?? []).map((r) => r.slug)
}

export async function getAllPublishedPages(): Promise<Pick<SeoPage, 'slug' | 'route_pattern' | 'updated_at'>[]> {
  const { data } = await supabase
    .from('seo_pages')
    .select('slug, route_pattern, updated_at')
    .eq('status', 'published')
  return data ?? []
}

export function parseContent(page: SeoPage): SeoContent {
  const c = page.content as Record<string, unknown>
  return {
    heroHeadline: (c.heroHeadline as string) ?? '',
    heroSubheadline: (c.heroSubheadline as string) ?? '',
    cityContext: c.cityContext as string | undefined,
    problemStatement: (c.problemStatement as string) ?? '',
    solution: (c.solution as string) ?? '',
    benefits: (c.benefits as SeoContent['benefits']) ?? [],
    localSignals: c.localSignals as string[] | undefined,
    ctaText: (c.ctaText as string) ?? 'Get in Touch',
    faq: (c.faq as SeoContent['faq']) ?? { question: '', answer: '' },
    testimonialMatch: c.testimonialMatch as string | undefined,
  }
}
