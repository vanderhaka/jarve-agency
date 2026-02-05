import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'
import { refreshPageContent } from '@/lib/seo/refresh'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { ok, remaining } = rateLimit(`seo-refresh:${ip}`, { limit: 10, windowMs: 3_600_000 })
  if (!ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 refreshes per hour.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  const { id } = await params
  const result = await refreshPageContent(id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
