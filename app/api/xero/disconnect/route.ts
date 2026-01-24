import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/xero/disconnect
 * Disconnects the Xero integration
 */
export async function POST() {
  const supabase = await createClient()

  // Check if user is authenticated and admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employee?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Deactivate all connections
    const { error } = await supabase
      .from('xero_connections')
      .update({ is_active: false })
      .eq('is_active', true)

    if (error) {
      console.error('Failed to disconnect Xero', { error })
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    console.info('Xero disconnected', { userId: user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Xero disconnect error', { error })
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
