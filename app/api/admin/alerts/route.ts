import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAlert, getActiveAlerts, type AlertType, type AlertSeverity } from '@/lib/seo/alerts'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alerts = await getActiveAlerts()
  return NextResponse.json({ alerts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, severity, title, message, metadata } = body

    if (!type || !severity || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, title' },
        { status: 400 }
      )
    }

    const alert = await createAlert(
      type as AlertType,
      severity as AlertSeverity,
      title,
      message,
      metadata
    )

    if (!alert) {
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
