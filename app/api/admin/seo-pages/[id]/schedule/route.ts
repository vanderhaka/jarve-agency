import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'
import { schedulePage, unschedulePage } from '@/lib/seo/scheduling'

const scheduleSchema = z.object({
  publish_at: z.string().datetime().refine(
    (val) => new Date(val) > new Date(),
    { message: 'publish_at must be a future date' }
  ),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const { id } = await params
  const body = await request.json()
  const parsed = scheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 }
    )
  }

  const publishDate = new Date(parsed.data.publish_at)

  const result = await schedulePage(id, publishDate)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, scheduled_at: publishDate.toISOString() })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (isAuthError(auth)) return auth

  const { id } = await params
  const success = await unschedulePage(id)
  if (!success) {
    return NextResponse.json({ error: 'Failed to unschedule page' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
