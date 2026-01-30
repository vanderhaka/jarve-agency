import { NextRequest, NextResponse } from 'next/server'
import { runDailyRankCheck } from '@/lib/seo/serp-tracker'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('CRON_SECRET not set')
    return false
  }
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyRankCheck()

    console.log(
      `[serp-check] Checked ${result.checked} keywords, ` +
      `${result.found} found in top 100, ` +
      `${result.errors.length} errors`
    )

    if (result.errors.length > 0) {
      console.warn('[serp-check] Errors:', result.errors)
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[serp-check] Fatal error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
