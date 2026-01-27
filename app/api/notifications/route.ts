import { NextRequest, NextResponse } from 'next/server'
import { getNotifications, getUnreadCount } from '@/lib/notifications/data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const includeRead = searchParams.get('includeRead') !== 'false'

  const { notifications, total } = await getNotifications({
    limit,
    offset,
    includeRead,
  })

  const unreadCount = await getUnreadCount()

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
  })
}
