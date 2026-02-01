import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { exportToCSV, exportToJSON } from '@/lib/seo/export'

interface RankingRow {
  id: string
  position: number | null
  url: string | null
  date: string
  created_at: string
  tracked_keywords: {
    keyword: string
    tracked_sites: {
      domain: string
      name: string
    }[]
  }[]
}

/**
 * GET /api/admin/export/rankings
 * Export ranking history data
 * Query params:
 *   - format: 'csv' | 'json' (default: 'csv')
 *   - days: number of days to export (default: 30)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check admin access
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee || employee.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get query params
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'csv'
  const days = parseInt(searchParams.get('days') || '30', 10)

  // Fetch ranking data with keyword and site info
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]

  const { data: rankings, error } = await supabase
    .from('ranking_history')
    .select(
      `
      id,
      position,
      url,
      date,
      created_at,
      tracked_keywords (
        keyword,
        tracked_sites (
          domain,
          name
        )
      )
    `
    )
    .gte('date', cutoffStr)
    .order('date', { ascending: false })

  if (error) {
    console.error('[export/rankings] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data for export
  const exportData = (rankings as RankingRow[]).map((r) => ({
    date: r.date,
    keyword: r.tracked_keywords?.[0]?.keyword || '',
    site: r.tracked_keywords?.[0]?.tracked_sites?.[0]?.name || '',
    domain: r.tracked_keywords?.[0]?.tracked_sites?.[0]?.domain || '',
    position: r.position ?? '',
    url: r.url || '',
    created_at: r.created_at,
  }))

  if (format === 'json') {
    const json = exportToJSON(exportData)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rankings-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  }

  // CSV export
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'keyword', label: 'Keyword' },
    { key: 'site', label: 'Site Name' },
    { key: 'domain', label: 'Domain' },
    { key: 'position', label: 'Position' },
    { key: 'url', label: 'Ranking URL' },
    { key: 'created_at', label: 'Recorded At' },
  ]

  const csv = exportToCSV(exportData, columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="rankings-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
