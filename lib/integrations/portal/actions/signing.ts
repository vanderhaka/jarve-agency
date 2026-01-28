/**
 * Portal Signing Actions
 * Secure data access for proposal/MSA signing flows
 */

'use server'

import { createPortalServiceClient } from '@/utils/supabase/portal-service'

interface PortalSigningClientUser {
  id: string
  name: string | null
  email: string | null
  client_id: string
}

interface PortalSigningMSA {
  id: string
  title: string
  status: string
  content: unknown
  client: { name: string } | null
  sent_to_client_user_id: string | null
}

interface PortalSigningProposalVersion {
  id: string
  version: number
  content: unknown
  subtotal: number | null
  gst_rate: number | null
  gst_amount: number | null
  total: number | null
  sent_to_client_user_id: string | null
  sent_at: string | null
}

interface PortalSigningProposal {
  id: string
  title: string
  status: string
  current_version: number | null
  client_id: string
  client: { name: string } | null
  versions: PortalSigningProposalVersion[]
}

export async function getPortalMsaSigningData(
  token: string,
  msaId: string
): Promise<
  | { success: true; msa: PortalSigningMSA; clientUser: PortalSigningClientUser }
  | { success: false; error: string }
> {
  try {
    const supabase = createPortalServiceClient()

    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_user_id, revoked_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or expired access link' }
    }

    if (tokenData.revoked_at) {
      return { success: false, error: 'This access link has been revoked' }
    }

    const { data: clientUser, error: clientUserError } = await supabase
      .from('client_users')
      .select('id, name, email, client_id')
      .eq('id', tokenData.client_user_id)
      .single()

    if (clientUserError || !clientUser) {
      return { success: false, error: 'Invalid client user' }
    }

    const { data: msa, error: msaError } = await supabase
      .from('client_msas')
      .select(
        `
        id, title, status, content, client_id, sent_to_client_user_id,
        client:clients(name)
        `
      )
      .eq('id', msaId)
      .single()

    if (msaError || !msa) {
      return { success: false, error: 'MSA not found' }
    }

    if (msa.client_id !== clientUser.client_id) {
      return { success: false, error: 'Access denied' }
    }

    if (msa.sent_to_client_user_id && msa.sent_to_client_user_id !== clientUser.id) {
      return { success: false, error: 'Access denied' }
    }

    const clientData = Array.isArray(msa.client) ? msa.client[0] : msa.client

    return {
      success: true,
      msa: {
        id: msa.id,
        title: msa.title,
        status: msa.status,
        content: msa.content,
        client: clientData ?? null,
        sent_to_client_user_id: msa.sent_to_client_user_id,
      },
      clientUser: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        client_id: clientUser.client_id,
      },
    }
  } catch (error) {
    console.error('Error loading MSA signing data:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getPortalProposalSigningData(
  token: string,
  proposalId: string
): Promise<
  | { success: true; proposal: PortalSigningProposal; clientUser: PortalSigningClientUser }
  | { success: false; error: string }
> {
  try {
    const supabase = createPortalServiceClient()

    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_user_id, revoked_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or expired access link' }
    }

    if (tokenData.revoked_at) {
      return { success: false, error: 'This access link has been revoked' }
    }

    const { data: clientUser, error: clientUserError } = await supabase
      .from('client_users')
      .select('id, name, email, client_id')
      .eq('id', tokenData.client_user_id)
      .single()

    if (clientUserError || !clientUser) {
      return { success: false, error: 'Invalid client user' }
    }

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(
        `
        id, title, status, current_version, client_id,
        client:clients(name),
        versions:proposal_versions(
          id, version, content, subtotal, gst_rate, gst_amount, total,
          sent_to_client_user_id, sent_at
        )
        `
      )
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    if (proposal.client_id !== clientUser.client_id) {
      return { success: false, error: 'Access denied' }
    }

    const versions = (Array.isArray(proposal.versions) ? proposal.versions : []) as PortalSigningProposalVersion[]
    const sentVersions = versions.filter(
      (version) => version.sent_to_client_user_id === clientUser.id && !!version.sent_at
    )

    if (sentVersions.length === 0) {
      return { success: false, error: 'Access denied' }
    }

    const clientData = Array.isArray(proposal.client) ? proposal.client[0] : proposal.client

    return {
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        current_version: proposal.current_version,
        client_id: proposal.client_id,
        client: clientData ?? null,
        versions: sentVersions,
      },
      clientUser: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        client_id: clientUser.client_id,
      },
    }
  } catch (error) {
    console.error('Error loading proposal signing data:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
