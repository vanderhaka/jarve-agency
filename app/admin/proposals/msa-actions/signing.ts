'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createPortalServiceClient } from '@/utils/supabase/portal-service'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { SignMSASchema } from '../schemas'
import type { SignMSAInput } from '../schemas'
import type { SendMSAInput } from './types'
import { generatePortalToken } from './helpers'

// Get client IP from request headers
async function getClientIp(): Promise<string | null> {
  const headersList = await headers()
  // Try common headers in order of reliability
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || headersList.get('cf-connecting-ip') // Cloudflare
    || null
  return ip
}

// ============================================================
// Send MSA to Client
// ============================================================

export async function sendMSA(msaId: string, input: SendMSAInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get MSA
  const { data: msa, error: msaError } = await supabase
    .from('client_msas')
    .select('id, client_id, status, sent_to_client_user_id')
    .eq('id', msaId)
    .single()

  if (msaError || !msa) {
    return { success: false, message: 'MSA not found' }
  }

  if (msa.status === 'signed') {
    return { success: false, message: 'MSA is already signed' }
  }

  // Verify client user
  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select('id, name, email, client_id')
    .eq('id', input.clientUserId)
    .single()

  if (clientUserError || !clientUser) {
    return { success: false, message: 'Client user not found' }
  }

  // Ensure client user belongs to the MSA's client
  if (clientUser.client_id !== msa.client_id) {
    return { success: false, message: 'Client user does not belong to this client' }
  }

  try {
    // Check/create portal token
    const { data: existingToken } = await supabase
      .from('client_portal_tokens')
      .select('id, token')
      .eq('client_user_id', clientUser.id)
      .is('revoked_at', null)
      .single()

    let portalToken: string

    if (existingToken) {
      portalToken = existingToken.token
    } else {
      portalToken = generatePortalToken()
      const { error: tokenError } = await supabase
        .from('client_portal_tokens')
        .insert({
          client_user_id: clientUser.id,
          token: portalToken
        })

      if (tokenError) {
        console.error('[sendMSA] Token error:', tokenError)
        return { success: false, message: 'Failed to generate portal access link' }
      }
    }

    // Update MSA status
    const { error: updateError } = await supabase
      .from('client_msas')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to_client_user_id: clientUser.id
      })
      .eq('id', msaId)

    if (updateError) {
      console.error('[sendMSA] Update error:', updateError)
      return { success: false, message: 'Failed to update MSA status' }
    }

    revalidatePath('/admin/proposals')
    revalidatePath(`/admin/clients/${msa.client_id}`)

    const portalUrl = `/portal/msa/${msaId}?token=${portalToken}`

    return {
      success: true,
      message: `MSA sent to ${clientUser.name}`,
      portalUrl,
      clientUserEmail: clientUser.email
    }
  } catch (error) {
    console.error('[sendMSA] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Sign MSA (Client Portal)
// ============================================================

export async function signMSA(msaId: string, rawInput: SignMSAInput) {
  // Validate and sanitize input (XSS protection for SVG)
  const parseResult = SignMSASchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { success: false, message: 'Invalid input: ' + parseResult.error.issues[0]?.message }
  }
  const input = parseResult.data

  const supabase = createPortalServiceClient()
  const clientIp = await getClientIp()

  // Validate token
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select(`
      id,
      client_user_id,
      revoked_at,
      view_count,
      client_users (
        id,
        name,
        email,
        client_id
      )
    `)
    .eq('token', input.token)
    .single()

  if (tokenError || !tokenData) {
    return { success: false, message: 'Invalid access token' }
  }

  if (tokenData.revoked_at) {
    return { success: false, message: 'Access token has been revoked' }
  }

  // Supabase joins return arrays - extract first element
  const clientUsersData = tokenData.client_users
  const clientUser = Array.isArray(clientUsersData) ? clientUsersData[0] : clientUsersData

  if (!clientUser) {
    return { success: false, message: 'Invalid client user' }
  }

  // Get MSA and verify it belongs to this client
  const { data: msa, error: msaError } = await supabase
    .from('client_msas')
    .select('id, client_id, status, sent_to_client_user_id')
    .eq('id', msaId)
    .single()

  if (msaError || !msa) {
    return { success: false, message: 'MSA not found' }
  }

  if (msa.client_id !== clientUser.client_id) {
    return { success: false, message: 'Access denied' }
  }
  if (msa.sent_to_client_user_id && msa.sent_to_client_user_id !== clientUser.id) {
    return { success: false, message: 'Access denied' }
  }

  if (msa.status === 'signed') {
    return { success: false, message: 'This MSA has already been signed' }
  }

  try {
    const now = new Date().toISOString()

    // Update MSA with signature
    const { error: updateError } = await supabase
      .from('client_msas')
      .update({
        status: 'signed',
        signed_at: now,
        signer_name: input.signerName,
        signer_email: input.signerEmail,
        signature_svg: input.signatureSvg,
        ip_address: clientIp
      })
      .eq('id', msaId)

    if (updateError) {
      console.error('[signMSA] Update error:', updateError)
      return { success: false, message: 'Failed to record signature' }
    }

    // Create contract doc entry
    const { error: contractDocError } = await supabase
      .from('contract_docs')
      .insert({
        client_id: msa.client_id,
        project_id: null,
        doc_type: 'msa',
        title: 'Master Service Agreement',
        version: 1,
        file_path: '', // PDF path will be set after generation
        signed_at: now,
        source_table: 'client_msas',
        source_id: msaId
      })

    if (contractDocError) {
      console.error('[signMSA] Contract doc error:', contractDocError)
      // Non-critical, continue
    }

    // Update token view count
    await supabase
      .from('client_portal_tokens')
      .update({
        last_viewed_at: now,
        view_count: (tokenData.view_count || 0) + 1
      })
      .eq('id', tokenData.id)

    return {
      success: true,
      message: 'MSA signed successfully',
      signedAt: now
    }
  } catch (error) {
    console.error('[signMSA] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}
