import { NextRequest, NextResponse } from 'next/server'
import { runLinkHealthCheck } from '@/lib/seo/link-health'
import { createAlert } from '@/lib/seo/alerts'

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

  const brokenCount = await runLinkHealthCheck()

  if (brokenCount > 0) {
    await createAlert(
      'broken_link',
      brokenCount >= 10 ? 'critical' : 'warning',
      `${brokenCount} broken link${brokenCount === 1 ? '' : 's'} detected`,
      `Link health check found ${brokenCount} broken links across published pages.`,
      { broken_count: brokenCount }
    )
  }

  return NextResponse.json({
    checked: true,
    broken_count: brokenCount,
  })
}
