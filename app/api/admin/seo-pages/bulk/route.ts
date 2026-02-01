import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { bulkPublish, bulkUnpublish, bulkDelete, bulkRefresh } from '@/lib/seo/bulk'

const VALID_ACTIONS = ['publish', 'unpublish', 'delete', 'refresh'] as const
type BulkAction = (typeof VALID_ACTIONS)[number]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, pageIds } = body as { action: string; pageIds: string[] }

  if (!action || !VALID_ACTIONS.includes(action as BulkAction)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    return NextResponse.json({ error: 'pageIds must be a non-empty array' }, { status: 400 })
  }

  if (pageIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 pages per bulk operation' }, { status: 400 })
  }

  const handlers: Record<BulkAction, (ids: string[]) => ReturnType<typeof bulkPublish>> = {
    publish: bulkPublish,
    unpublish: bulkUnpublish,
    delete: bulkDelete,
    refresh: bulkRefresh,
  }

  const result = await handlers[action as BulkAction](pageIds)

  return NextResponse.json(result)
}
