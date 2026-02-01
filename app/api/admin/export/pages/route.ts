import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { exportToCSV, exportToJSON } from '@/lib/seo/export'

/**
 * GET /api/admin/export/pages
 * Export SEO pages data
 * Query params:
 *   - format: 'csv' | 'json' (default: 'csv')
 *   - status: 'all' | 'draft' | 'published' (default: 'all')
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
  const status = searchParams.get('status') || 'all'

  // Build query
  let query = supabase
    .from('seo_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (status === 'draft') {
    query = query.eq('published', false)
  } else if (status === 'published') {
    query = query.eq('published', true)
  }

  const { data: pages, error } = await query

  if (error) {
    console.error('[export/pages] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data for export
  const exportData = pages.map((p) => ({
    slug: p.slug,
    city: p.city,
    state: p.state,
    tier: p.tier,
    industry: p.industry || '',
    service: p.service || '',
    solution: p.solution || '',
    comparison: p.comparison || '',
    title: p.title,
    description: p.description,
    h1: p.h1,
    published: p.published,
    word_count: p.word_count || '',
    quality_score: p.quality_score || '',
    created_at: p.created_at,
    published_at: p.published_at || '',
  }))

  if (format === 'json') {
    const json = exportToJSON(exportData)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="seo-pages-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  }

  // CSV export
  const columns = [
    { key: 'slug', label: 'Slug' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'tier', label: 'Tier' },
    { key: 'industry', label: 'Industry' },
    { key: 'service', label: 'Service' },
    { key: 'solution', label: 'Solution' },
    { key: 'comparison', label: 'Comparison' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'h1', label: 'H1' },
    { key: 'published', label: 'Published' },
    { key: 'word_count', label: 'Word Count' },
    { key: 'quality_score', label: 'Quality Score' },
    { key: 'created_at', label: 'Created At' },
    { key: 'published_at', label: 'Published At' },
  ]

  const csv = exportToCSV(exportData, columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="seo-pages-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
