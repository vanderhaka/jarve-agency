import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { acknowledgeAlert, resolveAlert } from '@/lib/seo/alerts'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'acknowledge') {
      const success = await acknowledgeAlert(id)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to acknowledge alert' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'resolve') {
      const success = await resolveAlert(id)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to resolve alert' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "acknowledge" or "resolve"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
