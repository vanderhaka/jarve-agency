'use server'

import { revalidatePath } from 'next/cache'
import { requireEmployee } from '@/lib/auth/require-employee'
import { sendProposalEmail } from '@/lib/email/resend'
import { generatePortalToken } from './helpers'
import type { SendProposalInput } from './types'

// ============================================================
// Send Proposal to Client
// ============================================================

export async function sendProposal(proposalId: string, input: SendProposalInput) {
  const { supabase } = await requireEmployee()

  // Get proposal with client info
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      id,
      title,
      current_version,
      status,
      client_id,
      lead_id,
      project_id
    `)
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return { success: false, message: 'Proposal not found' }
  }

  if (proposal.status === 'signed') {
    return { success: false, message: 'Proposal is already signed' }
  }

  const versionToSend = input.version || proposal.current_version

  // Verify the client user exists
  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select('id, name, email, client_id')
    .eq('id', input.clientUserId)
    .single()

  if (clientUserError || !clientUser) {
    return { success: false, message: 'Client user not found' }
  }

  try {
    // Check if client user has an active portal token
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
      // Create new portal token
      portalToken = generatePortalToken()
      const { error: tokenError } = await supabase
        .from('client_portal_tokens')
        .insert({
          client_user_id: clientUser.id,
          token: portalToken
        })

      if (tokenError) {
        console.error('[sendProposal] Token error:', tokenError)
        return { success: false, message: 'Failed to generate portal access link' }
      }
    }

    // Parallelize version and proposal updates for better performance
    const proposalUpdate: { status: string; client_id?: string } = { status: 'sent' }
    if (!proposal.client_id && clientUser.client_id) {
      proposalUpdate.client_id = clientUser.client_id
    }

    const [versionResult, proposalResult] = await Promise.all([
      supabase
        .from('proposal_versions')
        .update({
          sent_at: new Date().toISOString(),
          sent_to_client_user_id: clientUser.id
        })
        .eq('proposal_id', proposalId)
        .eq('version', versionToSend),
      supabase
        .from('proposals')
        .update(proposalUpdate)
        .eq('id', proposalId)
    ])

    if (versionResult.error) {
      console.error('[sendProposal] Version update error:', versionResult.error)
    }
    if (proposalResult.error) {
      console.error('[sendProposal] Proposal update error:', proposalResult.error)
      return { success: false, message: 'Failed to update proposal status' }
    }

    revalidatePath('/admin/proposals')
    revalidatePath(`/admin/proposals/${proposalId}`)

    // Generate portal URL
    const portalUrl = `/portal/proposal/${proposalId}?token=${portalToken}`

    // Send email to client
    try {
      await sendProposalEmail({
        to: clientUser.email,
        recipientName: clientUser.name,
        proposalTitle: proposal.title,
        portalUrl
      })
    } catch (emailError) {
      console.error('[sendProposal] Email error:', emailError)
      return {
        success: true,
        message: `Proposal v${versionToSend} sent but email delivery failed. Portal URL: ${portalUrl}`,
        portalUrl,
        clientUserEmail: clientUser.email,
        emailSent: false
      }
    }

    return {
      success: true,
      message: `Proposal v${versionToSend} emailed to ${clientUser.name}`,
      portalUrl,
      clientUserEmail: clientUser.email,
      emailSent: true
    }
  } catch (error) {
    console.error('[sendProposal] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}
