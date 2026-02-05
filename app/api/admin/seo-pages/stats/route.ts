import { NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function GET() {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth
  const { supabase } = auth

  // Total counts by status
  const { data: statusCounts } = await supabase
    .from('seo_pages')
    .select('status')

  const published = statusCounts?.filter((r) => r.status === 'published').length ?? 0
  const draft = statusCounts?.filter((r) => r.status === 'draft').length ?? 0
  const total = statusCounts?.length ?? 0

  // Breakdown by route_pattern + city_tier
  const { data: breakdownRows } = await supabase
    .from('seo_pages')
    .select('route_pattern, city_tier, status')

  const breakdown: Record<string, { published: number; draft: number; total: number }> = {}
  for (const row of breakdownRows ?? []) {
    const tierLabel = row.city_tier ? ` (tier ${row.city_tier})` : ''
    const key = `${row.route_pattern}${tierLabel}`
    if (!breakdown[key]) breakdown[key] = { published: 0, draft: 0, total: 0 }
    breakdown[key].total++
    if (row.status === 'published') breakdown[key].published++
    else breakdown[key].draft++
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

  // Estimated completion: remaining drafts ÷ 5/day
  const remaining = draft
  const dripRate = 5
  const estDays = remaining > 0 ? Math.ceil(remaining / dripRate) : 0
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
      // Check if any ranking URL contains this page's slug
      for (const url of rankedUrlSet) {
        if (url && url.includes(page.slug)) {
          pagesRanking++
          break
        }
      }
    }
  }

  return NextResponse.json({
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
  })
}
