import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { runQualityGate } from '@/lib/seo/quality-gate'
import { revalidatePath } from 'next/cache'
import { services } from '@/lib/seo/services'
import { cities } from '@/lib/seo/cities'
import { industries } from '@/lib/seo/industries'
import type { SeoContent } from '@/lib/seo/types'
import { createVersion } from '@/lib/seo/versioning'
import { publishScheduledPages } from '@/lib/seo/scheduling'

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
        for (const c of cities) {
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

  // Publish any scheduled pages that are due
  const scheduled = await publishScheduledPages()

  const supabase = createAdminClient()
  const BATCH_SIZE = 5

  // Get next unpublished pages with single query, then sort by wave priority
  const { data: allDraftPages } = await supabase
    .from('seo_pages')
    .select('id, slug, route_pattern, content, meta_title, meta_description, city_tier, created_at')
    .eq('status', 'draft')
    .in('route_pattern', WAVE_ORDER)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE * WAVE_ORDER.length)

  // Sort by wave priority, then city_tier (for city patterns), then created_at
  const waveIndex = new Map(WAVE_ORDER.map((p, i) => [p, i]))
  const sorted = (allDraftPages ?? []).sort((a, b) => {
    const wA = waveIndex.get(a.route_pattern) ?? 999
    const wB = waveIndex.get(b.route_pattern) ?? 999
    if (wA !== wB) return wA - wB
    // For city patterns, sort by tier
    if (a.city_tier !== b.city_tier) return (a.city_tier ?? 99) - (b.city_tier ?? 99)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const pages = sorted.slice(0, BATCH_SIZE)

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
        const updatedContent = { ...content, quality_issues: result.errors }
        await supabase
          .from('seo_pages')
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id)

        // Create version for failed quality gate
        await createVersion(
          page.id,
          updatedContent,
          page.meta_title,
          page.meta_description
        )

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

      // Create version for published page
      await createVersion(
        page.id,
        content,
        page.meta_title,
        page.meta_description
      )

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
    scheduled_published: scheduled.published,
    published,
    failed,
    remaining: count ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  })
}
