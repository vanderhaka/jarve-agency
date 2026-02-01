import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { schedulePage, unschedulePage } from '@/lib/seo/scheduling'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { publish_at } = body

  if (!publish_at) {
    return NextResponse.json({ error: 'publish_at is required' }, { status: 400 })
  }

  const publishDate = new Date(publish_at)
  if (isNaN(publishDate.getTime()) || publishDate <= new Date()) {
    return NextResponse.json({ error: 'publish_at must be a valid future date' }, { status: 400 })
  }

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const success = await unschedulePage(id)
  if (!success) {
    return NextResponse.json({ error: 'Failed to unschedule page' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
