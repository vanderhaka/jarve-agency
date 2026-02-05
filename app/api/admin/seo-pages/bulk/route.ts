import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'
import { bulkPublish, bulkUnpublish, bulkDelete, bulkRefresh } from '@/lib/seo/bulk'
import { rateLimit } from '@/lib/rate-limit'

const VALID_ACTIONS = ['publish', 'unpublish', 'delete', 'refresh'] as const
type BulkAction = (typeof VALID_ACTIONS)[number]

const bulkSchema = z.object({
  action: z.enum(VALID_ACTIONS),
  pageIds: z.array(z.string().uuid()).min(1).max(100),
})

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { ok, remaining } = rateLimit(`seo-bulk:${ip}`, { limit: 20, windowMs: 3_600_000 })
  if (!ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 20 bulk operations per hour.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  const body = await request.json()
  const parsed = bulkSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 }
    )
  }

  const { action, pageIds } = parsed.data

  const handlers: Record<BulkAction, (ids: string[]) => ReturnType<typeof bulkPublish>> = {
    publish: bulkPublish,
    unpublish: bulkUnpublish,
    delete: bulkDelete,
    refresh: bulkRefresh,
  }

  const result = await handlers[action](pageIds)

  return NextResponse.json(result)
}
