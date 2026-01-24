import { createClient } from '@/utils/supabase/server'
import { getXeroAuthUrl } from '@/lib/integrations/xero/client'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * GET /api/xero/connect
 * Initiates the Xero OAuth flow
 */
export async function GET() {
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
    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex')

    // Store state in cookie for validation on callback
    const authUrl = getXeroAuthUrl(state)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Failed to initiate Xero OAuth', { error })
    return NextResponse.json(
      { error: 'Failed to connect to Xero' },
      { status: 500 }
    )
  }
}
