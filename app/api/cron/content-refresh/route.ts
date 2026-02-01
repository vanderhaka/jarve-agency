import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { refreshPageContent } from '@/lib/seo/refresh'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('CRON_SECRET not set')
    return false
  }
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const staleThresholdDays = 90

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - staleThresholdDays)

  const { data: stalePages } = await supabase
    .from('seo_pages')
    .select('id, slug')
    .eq('status', 'published')
    .lt('updated_at', cutoff.toISOString())
    .order('updated_at', { ascending: true })
    .limit(5)

  if (!stalePages || stalePages.length === 0) {
    return NextResponse.json({ refreshed: 0, message: 'No stale pages' })
  }

  let refreshed = 0
  const errors: string[] = []

  for (const page of stalePages) {
    const result = await refreshPageContent(page.id)
    if (result.success) {
      refreshed++
    } else {
      errors.push(`${page.slug}: ${result.error}`)
    }
  }

  return NextResponse.json({
    refreshed,
    failed: stalePages.length - refreshed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
