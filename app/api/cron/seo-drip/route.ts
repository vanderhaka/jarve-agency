import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { runQualityGate } from '@/lib/seo/quality-gate'
import { revalidatePath } from 'next/cache'
import { services } from '@/lib/seo/services'
import { cities, tier1Cities } from '@/lib/seo/cities'
import { industries } from '@/lib/seo/industries'
import type { SeoContent } from '@/lib/seo/types'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('CRON_SECRET not set')
    return false
  }
  return authHeader === `Bearer ${cronSecret}`
}

// Wave priority for route patterns
const WAVE_ORDER = [
  'services-city',
  'industries',
  'comparisons',
  'solutions',
  'industries-city',
]

function slugToPath(slug: string, routePattern: string): string | null {
  switch (routePattern) {
    case 'services-city': {
      for (const svc of services) {
        for (const c of cities) {
          if (`${svc.slug}-${c.slug}` === slug) {
            return `/services/${svc.slug}/${c.slug}`
          }
        }
      }
      return null
    }
    case 'industries':
      return `/industries/${slug.replace('industry-', '')}`
    case 'industries-city': {
      for (const ind of industries) {
        for (const c of [...tier1Cities]) {
          if (`industry-${ind.slug}-${c.slug}` === slug) {
            return `/industries/${ind.slug}/${c.slug}`
          }
        }
      }
      return null
    }
    case 'solutions':
      return `/solutions/${slug.replace('solution-', '')}`
    case 'comparisons':
      return `/compare/${slug.replace('compare-', '')}`
    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const BATCH_SIZE = 5

  // Get next unpublished pages ordered by wave priority
  // We query each wave in order until we have BATCH_SIZE pages
  const pages: Array<{
    id: string
    slug: string
    route_pattern: string
    content: Record<string, unknown>
    meta_title: string
    meta_description: string
  }> = []

  for (const pattern of WAVE_ORDER) {
    if (pages.length >= BATCH_SIZE) break

    const remaining = BATCH_SIZE - pages.length
    const { data } = await supabase
      .from('seo_pages')
      .select('id, slug, route_pattern, content, meta_title, meta_description')
      .eq('route_pattern', pattern)
      .eq('status', 'draft')
      .order('created_at', { ascending: true })
      .limit(remaining)

    if (data) pages.push(...data)
  }

  if (pages.length === 0) {
    return NextResponse.json({
      published: 0,
      failed: 0,
      remaining: 0,
      message: 'No pages to publish',
    })
  }

  let published = 0
  let failed = 0
  const errors: Array<{ slug: string; issues: string[] }> = []

  for (const page of pages) {
    try {
      const content = page.content as Record<string, unknown>

      // If content is empty/missing key fields, skip
      if (!content || !content.heroHeadline) {
        errors.push({
          slug: page.slug,
          issues: [
            'No content generated - requires manual generation via CLI',
          ],
        })
        failed++
        continue
      }

      // Parse content for quality check
      const parsed: SeoContent = {
        heroHeadline: (content.heroHeadline as string) ?? '',
        heroSubheadline: (content.heroSubheadline as string) ?? '',
        cityContext: content.cityContext as string | undefined,
        problemStatement: (content.problemStatement as string) ?? '',
        solution: (content.solution as string) ?? '',
        benefits: (content.benefits as SeoContent['benefits']) ?? [],
        localSignals: content.localSignals as string[] | undefined,
        ctaText: (content.ctaText as string) ?? 'Get in Touch',
        faq: Array.isArray(content.faq)
          ? (content.faq as SeoContent['faq'])
          : [],
        layout: content.layout as SeoContent['layout'],
        testimonialMatch: content.testimonialMatch as string | undefined,
        metaDescription: content.metaDescription as string | undefined,
      }

      // Run quality gate
      const result = runQualityGate(parsed)

      if (!result.passed) {
        // Store quality issues in content and skip
        await supabase
          .from('seo_pages')
          .update({
            content: { ...content, quality_issues: result.errors },
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id)

        errors.push({ slug: page.slug, issues: result.errors })
        failed++
        continue
      }

      // Publish the page
      await supabase
        .from('seo_pages')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)

      // Revalidate the page path
      const path = slugToPath(page.slug, page.route_pattern)
      if (path) revalidatePath(path)

      published++
    } catch (err) {
      errors.push({
        slug: page.slug,
        issues: [err instanceof Error ? err.message : 'Unknown error'],
      })
      failed++
    }
  }

  // Revalidate sitemap
  revalidatePath('/sitemap.xml')

  // Count remaining draft pages
  const { count } = await supabase
    .from('seo_pages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')

  return NextResponse.json({
    published,
    failed,
    remaining: count ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  })
}
