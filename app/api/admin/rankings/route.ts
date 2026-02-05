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
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '500', 10), 1000)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  let query = supabase
    .from('ranking_history')
    .select('id, position, url, date, keyword:tracked_keywords!inner(id, keyword, site_id)', { count: 'exact' })
    .gte('date', sinceStr)
    .order('date', { ascending: true })
    .range(offset, offset + limit - 1)

  if (siteId) {
    query = query.eq('tracked_keywords.site_id', siteId)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rankings: data, total: count })
}
