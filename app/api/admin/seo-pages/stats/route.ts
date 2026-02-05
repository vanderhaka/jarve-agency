import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/utils/supabase/admin'

const getStats = unstable_cache(
  async () => {
    const supabase = createAdminClient()

    // DB-level aggregation via RPC functions
    const [statusResult, breakdownResult] = await Promise.all([
      supabase.rpc('get_seo_status_counts'),
      supabase.rpc('get_seo_breakdown'),
    ])

    const statusRows = (statusResult.data ?? []) as { status: string; count: number }[]
    let published = 0
    let draft = 0
    let total = 0
    for (const row of statusRows) {
      const n = Number(row.count)
      total += n
      if (row.status === 'published') published = n
      else if (row.status === 'draft') draft = n
    }

    // Build breakdown from DB aggregation
    const breakdownRows = (breakdownResult.data ?? []) as {
      route_pattern: string
      city_tier: number | null
      status: string
      count: number
    }[]
    const breakdown: Record<string, { published: number; draft: number; total: number }> = {}
    for (const row of breakdownRows) {
      const tierLabel = row.city_tier ? ` (tier ${row.city_tier})` : ''
      const key = `${row.route_pattern}${tierLabel}`
      if (!breakdown[key]) breakdown[key] = { published: 0, draft: 0, total: 0 }
      const n = Number(row.count)
      breakdown[key].total += n
      if (row.status === 'published') breakdown[key].published += n
      else breakdown[key].draft += n
    }

    // Recently published (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: recentPages } = await supabase
      .from('seo_pages')
      .select('id, slug, meta_title, updated_at')
      .eq('status', 'published')
      .gte('updated_at', weekAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10)

    // Estimated completion: remaining drafts / 5 per day
    const dripRate = 5
    const estDays = draft > 0 ? Math.ceil(draft / dripRate) : 0
    const estDate = new Date()
    estDate.setDate(estDate.getDate() + estDays)

    // Cross-reference published pages with ranking_history URLs
    const { data: publishedPages } = await supabase
      .from('seo_pages')
      .select('slug')
      .eq('status', 'published')

    let pagesRanking = 0
    if (publishedPages && publishedPages.length > 0) {
      const { data: rankingUrls } = await supabase
        .from('ranking_history')
        .select('url')
        .not('url', 'is', null)

      const rankedUrlSet = new Set(
        (rankingUrls ?? []).map((r) => r.url).filter(Boolean)
      )

      for (const page of publishedPages) {
        for (const url of rankedUrlSet) {
          if (url && url.includes(page.slug)) {
            pagesRanking++
            break
          }
        }
      }
    }

    return {
      published,
      draft,
      total,
      breakdown,
      recentPages: recentPages ?? [],
      dripRate,
      estCompletionDate: estDate.toISOString().split('T')[0],
      estDaysRemaining: estDays,
      pagesRanking,
      publishedTotal: published,
    }
  },
  ['seo-stats'],
  { revalidate: 300 } // 5 minutes
)

export async function GET() {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const stats = await getStats()
  return NextResponse.json(stats)
}
