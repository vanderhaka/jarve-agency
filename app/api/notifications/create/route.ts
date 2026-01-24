import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { CreateNotificationInput } from '@/lib/notifications/types'

/**
 * Create a notification for an event (proposal signed, invoice paid, etc.)
 * This endpoint is called by other parts of the system when important events occur.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the notification data from the request body
    const body = await request.json()
    const { user_id, type, title, body: notifBody, entity_type, entity_id } = body

    // Validate required fields
    if (!user_id || !type || !title || !entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title, entity_type, entity_id' },
        { status: 400 }
      )
    }

    // Create the notification
    const { data, error } = await supabase
      .from('notifications')
      .upsert(
        {
          user_id,
          type,
          title,
          body: notifBody || null,
          entity_type,
          entity_id,
        },
        {
          onConflict: 'user_id,entity_type,entity_id,type',
          ignoreDuplicates: false, // Update if exists (for re-notifications)
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
