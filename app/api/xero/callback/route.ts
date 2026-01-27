import { createClient } from '@/utils/supabase/server'
import {
  exchangeCodeForTokens,
  getXeroTenants,
} from '@/lib/integrations/xero/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/xero/callback
 * Handles the Xero OAuth callback
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const settingsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings`

  // Handle OAuth errors
  if (error) {
    console.error('Xero OAuth error', { error })
    return NextResponse.redirect(`${settingsUrl}?xero_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?xero_error=missing_params`)
  }

  // Validate state token
  const cookieStore = await cookies()
  const storedState = cookieStore.get('xero_oauth_state')?.value

  if (!storedState || storedState !== state) {
    console.error('Xero OAuth state mismatch')
    return NextResponse.redirect(`${settingsUrl}?xero_error=invalid_state`)
  }

  const supabase = await createClient()

  // Check if user is authenticated and admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${settingsUrl}?xero_error=unauthorized`)
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employee?.role !== 'admin') {
    return NextResponse.redirect(`${settingsUrl}?xero_error=admin_required`)
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens) {
      return NextResponse.redirect(`${settingsUrl}?xero_error=token_exchange_failed`)
    }

    // Get connected tenants
    const tenants = await getXeroTenants(tokens.access_token)
    if (tenants.length === 0) {
      return NextResponse.redirect(`${settingsUrl}?xero_error=no_tenants`)
    }

    // Use the first tenant (most apps are connected to one org)
    const tenant = tenants[0]

    // Deactivate any existing connections
    await supabase
      .from('xero_connections')
      .update({ is_active: false })
      .eq('is_active', true)

    // Store the new connection
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    const { error: insertError } = await supabase.from('xero_connections').insert({
      tenant_id: tenant.tenantId,
      tenant_name: tenant.tenantName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      is_active: true,
      connected_by: user.id,
    })

    if (insertError) {
      console.error('Failed to store Xero connection', { error: insertError })
      return NextResponse.redirect(`${settingsUrl}?xero_error=storage_failed`)
    }

    console.info('Xero connected successfully', {
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      userId: user.id,
    })

    // Clear the state cookie and redirect to settings
    const response = NextResponse.redirect(`${settingsUrl}?xero_connected=true`)
    response.cookies.delete('xero_oauth_state')

    return response
  } catch (error) {
    console.error('Xero callback error', { error })
    return NextResponse.redirect(`${settingsUrl}?xero_error=unexpected`)
  }
}
