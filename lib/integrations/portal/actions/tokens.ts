/**
 * Portal Token Validation
 * Internal helpers for validating portal access tokens
 */

'use server'

import { createPortalServiceClient } from '@/utils/supabase/portal-service'

export type TokenValidationResult =
  | { valid: true; clientUserId: string; clientId: string }
  | { valid: false; error: string }

/**
 * Validate a token has access to a specific project
 */
export async function validateTokenForProject(
  supabase: ReturnType<typeof createPortalServiceClient>,
  token: string,
  projectId: string
): Promise<TokenValidationResult> {
  // Get token and client user
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('client_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Get client user's client_id
  const { data: clientUser, error: userError } = await supabase
    .from('client_users')
    .select('id, client_id')
    .eq('id', tokenData.client_user_id)
    .single()

  if (userError || !clientUser) {
    return { valid: false, error: 'Client user not found' }
  }

  // Verify project belongs to this client
  const { data: project, error: projectError } = await supabase
    .from('agency_projects')
    .select('id')
    .eq('id', projectId)
    .eq('client_id', clientUser.client_id)
    .single()

  if (projectError || !project) {
    return { valid: false, error: 'Project not found or access denied' }
  }

  return { valid: true, clientUserId: clientUser.id, clientId: clientUser.client_id }
}

/**
 * Validate a token has access to a specific client
 * Used for client-level documents (MSAs) that aren't tied to a specific project
 */
export async function validateTokenForClient(
  supabase: ReturnType<typeof createPortalServiceClient>,
  token: string,
  clientId: string
): Promise<TokenValidationResult> {
  // Get token and client user
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('client_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Get client user's client_id
  const { data: clientUser, error: userError } = await supabase
    .from('client_users')
    .select('id, client_id')
    .eq('id', tokenData.client_user_id)
    .single()

  if (userError || !clientUser) {
    return { valid: false, error: 'Client user not found' }
  }

  // Verify the document's client_id matches the token holder's client_id
  if (clientUser.client_id !== clientId) {
    return { valid: false, error: 'Access denied' }
  }

  return { valid: true, clientUserId: clientUser.id, clientId: clientUser.client_id }
}
