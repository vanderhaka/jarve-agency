import { NextRequest, NextResponse } from 'next/server'
import { markAsRead } from '@/lib/notifications/data'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const success = await markAsRead(id)

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
