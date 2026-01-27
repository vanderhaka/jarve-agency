import { NextResponse } from 'next/server'
import { markAllAsRead } from '@/lib/notifications/data'

export async function POST() {
  const success = await markAllAsRead()

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
