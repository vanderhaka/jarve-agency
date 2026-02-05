/**
 * Client Portal Actions
 * Server actions for client portal token management
 *
 * Adapted from jarve-website for jarve-agency CRM
 * Full implementation in Stage 4
 */

'use server'

import { generateSecureToken } from '@/lib/crypto'
import { createClient } from '@/utils/supabase/server'
import type {
  ClientPortalToken,
  CreateClientPortalTokenResult,
  ClientPortalErrorResult,
  ClientPortalStatus,
} from './types'

/**
 * Get the base URL for portal links
 */
function getPortalBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000'
  if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
    return baseUrl.replace('http://', 'https://')
  }
  return baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
}

/**
 * Build a client portal URL from a token
 */
function buildClientPortalUrl(token: string): string {
  const baseUrl = getPortalBaseUrl()
  return `${baseUrl}/portal/${token}`
}

const generateToken = generateSecureToken

/**
 * Create a new client portal token for a client user
 */
export async function createClientPortalToken(
  clientUserId: string
): Promise<CreateClientPortalTokenResult | ClientPortalErrorResult> {
  try {
    const supabase = await createClient()

    // Verify the client user exists
    const { data: clientUser, error: userError } = await supabase
      .from('client_users')
      .select('id, name')
      .eq('id', clientUserId)
      .single()

    if (userError || !clientUser) {
      return { success: false, error: 'Client user not found' }
    }

    // Revoke any existing active tokens
    await supabase
      .from('client_portal_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('client_user_id', clientUserId)
      .is('revoked_at', null)

    // Generate new token
    const token = generateToken()

    // Insert the new token
    const { data: newToken, error: insertError } = await supabase
      .from('client_portal_tokens')
      .insert({
        client_user_id: clientUserId,
        token,
        view_count: 0,
      })
      .select()
      .single()

    if (insertError || !newToken) {
      console.error('Failed to create client portal token', insertError)
      return { success: false, error: 'Failed to create portal token' }
    }

    return {
      success: true,
      token: newToken as ClientPortalToken,
      url: buildClientPortalUrl(token),
    }
  } catch (error) {
    console.error('Unexpected error creating client portal token', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Revoke a client portal token
 */
export async function revokeClientPortalToken(
  tokenId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('client_portal_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId)

    if (error) {
      console.error('Failed to revoke client portal token', error)
      return { success: false, error: 'Failed to revoke token' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error revoking client portal token', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get client portal status for a client user
 */
export async function getClientPortalStatus(
  clientUserId: string
): Promise<ClientPortalStatus> {
  try {
    const supabase = await createClient()

    const { data: token, error } = await supabase
      .from('client_portal_tokens')
      .select('*')
      .eq('client_user_id', clientUserId)
      .is('revoked_at', null)
      .single()

    if (error || !token) {
      return {
        hasActiveToken: false,
        token: null,
        url: null,
        viewCount: 0,
        lastViewedAt: null,
      }
    }

    return {
      hasActiveToken: true,
      token: token as ClientPortalToken,
      url: buildClientPortalUrl(token.token),
      viewCount: token.view_count,
      lastViewedAt: token.last_viewed_at,
    }
  } catch (error) {
    console.error('Unexpected error getting client portal status', error)
    return {
      hasActiveToken: false,
      token: null,
      url: null,
      viewCount: 0,
      lastViewedAt: null,
    }
  }
}
