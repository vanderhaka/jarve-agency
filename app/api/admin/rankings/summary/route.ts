import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('site_id')

  // Get all sites
  const { data: sites } = await supabase
    .from('tracked_sites')
    .select('id, domain, name, active')
    .order('name')

  // Get latest rankings per keyword
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  let latestQuery = supabase
    .from('ranking_history')
    .select('position, date, keyword:tracked_keywords!inner(id, keyword, site_id)')
    .eq('date', today)

  if (siteId) {
    latestQuery = latestQuery.eq('tracked_keywords.site_id', siteId)
  }

  const { data: latestRankings } = await latestQuery

  // Get week-ago rankings for comparison
  let prevQuery = supabase
    .from('ranking_history')
    .select('position, keyword:tracked_keywords!inner(id, keyword, site_id)')
    .eq('date', weekAgoStr)

  if (siteId) {
    prevQuery = prevQuery.eq('tracked_keywords.site_id', siteId)
  }

  const { data: prevRankings } = await prevQuery

  // Calculate summary stats
  const positions = (latestRankings ?? [])
    .filter((r) => r.position !== null)
    .map((r) => r.position as number)

  const avgPosition = positions.length > 0
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null

  const top10 = positions.filter((p) => p <= 10).length
  const top30 = positions.filter((p) => p <= 30).length

  // Calculate movers (biggest position improvements)
  const prevMap = new Map<string, number>()
  for (const r of prevRankings ?? []) {
    const kw = r.keyword as unknown as { id: string }
    if (r.position !== null) prevMap.set(kw.id, r.position as number)
  }

  const movers: { keyword: string; current: number; previous: number; change: number }[] = []
  for (const r of latestRankings ?? []) {
    const kw = r.keyword as unknown as { id: string; keyword: string }
    const prev = prevMap.get(kw.id)
    if (prev !== undefined && r.position !== null) {
      movers.push({
        keyword: kw.keyword,
        current: r.position as number,
        previous: prev,
        change: prev - (r.position as number), // positive = improved
      })
    }
  }
  movers.sort((a, b) => b.change - a.change)

  return NextResponse.json({
    sites: sites ?? [],
    avgPosition,
    top10,
    top30,
    totalTracked: latestRankings?.length ?? 0,
    totalRanking: positions.length,
    topMovers: movers.slice(0, 5),
    biggestDrops: movers.slice(-5).reverse(),
  })
}
