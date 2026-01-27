'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { notifyProposalSigned } from '@/lib/notifications/actions'
import { sendProposalSignedEmail } from '@/lib/email/resend'
import { SignProposalSchema } from '../schemas'
import type { SignProposalInput } from './types'

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
// Sign Proposal (Client Portal)
// ============================================================

export async function signProposal(rawInput: SignProposalInput) {
  // Validate and sanitize input (XSS protection for SVG)
  const parseResult = SignProposalSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { success: false, message: 'Invalid input: ' + parseResult.error.issues[0]?.message }
  }
  const input = parseResult.data

  const supabase = await createClient()
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

  // Get the proposal that was sent to this client user
  // Find the most recent sent version for this client user
  const { data: sentVersion, error: sentVersionError } = await supabase
    .from('proposal_versions')
    .select(`
      id,
      proposal_id,
      version,
      proposals (
        id,
        status,
        client_id
      )
    `)
    .eq('sent_to_client_user_id', clientUser.id)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (sentVersionError || !sentVersion) {
    return { success: false, message: 'No proposal found for signing' }
  }

  // Supabase joins return arrays - extract first element
  const proposalsData = sentVersion.proposals
  const proposal = Array.isArray(proposalsData) ? proposalsData[0] : proposalsData

  if (!proposal) {
    return { success: false, message: 'Proposal not found' }
  }

  // Get lead_id for conversion (not included in join above)
  const { data: proposalWithLead } = await supabase
    .from('proposals')
    .select('lead_id')
    .eq('id', proposal.id)
    .single()

  const leadId = proposalWithLead?.lead_id

  if (proposal.status === 'signed') {
    return { success: false, message: 'This proposal has already been signed' }
  }

  try {
    const now = new Date().toISOString()

    // Create signature record
    const { error: signatureError } = await supabase
      .from('proposal_signatures')
      .insert({
        proposal_id: proposal.id,
        proposal_version_id: sentVersion.id,
        client_user_id: clientUser.id,
        signer_name: input.signerName,
        signer_email: input.signerEmail,
        signature_svg: input.signatureSvg,
        ip_address: clientIp,
        signed_at: now
      })

    if (signatureError) {
      console.error('[signProposal] Signature error:', signatureError)
      return { success: false, message: 'Failed to record signature' }
    }

    // Update proposal status
    const { error: proposalUpdateError } = await supabase
      .from('proposals')
      .update({
        status: 'signed',
        signed_at: now
      })
      .eq('id', proposal.id)

    if (proposalUpdateError) {
      console.error('[signProposal] Proposal update error:', proposalUpdateError)
      return { success: false, message: 'Failed to update proposal status' }
    }

    // Convert the lead now that proposal is signed
    if (leadId) {
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: now
        })
        .eq('id', leadId)

      if (leadUpdateError) {
        console.error('[signProposal] Lead conversion error:', leadUpdateError)
        // Non-critical, continue
      } else {
        console.log('[signProposal] Lead converted:', leadId)
      }
    }

    // Create contract doc entry (SOW)
    const { error: contractDocError } = await supabase
      .from('contract_docs')
      .insert({
        client_id: proposal.client_id,
        project_id: null, // Will be linked when available
        doc_type: 'sow',
        title: `Statement of Work - Proposal v${sentVersion.version}`,
        version: sentVersion.version,
        file_path: '', // PDF path will be set after generation
        signed_at: now,
        source_table: 'proposals',
        source_id: proposal.id
      })

    if (contractDocError) {
      console.error('[signProposal] Contract doc error:', contractDocError)
      // Non-critical, continue
    }

    // Update token view count
    await supabase
      .from('client_portal_tokens')
      .update({
        last_viewed_at: now,
        view_count: tokenData.view_count + 1
      })
      .eq('id', tokenData.id)

    // Get proposal details including pricing info
    const { data: proposalDetails } = await supabase
      .from('proposals')
      .select(`
        title,
        project_id,
        client_id,
        agency_projects(name, assigned_to)
      `)
      .eq('id', proposal.id)
      .single()

    // Get version content for project description
    const { data: versionData } = await supabase
      .from('proposal_versions')
      .select('content')
      .eq('id', sentVersion.id)
      .single()

    let projectId = proposalDetails?.project_id
    let projectName = 'Project'

    // Auto-create project if proposal doesn't have one linked
    if (proposalDetails && !proposalDetails.project_id) {
      const projectDescription = versionData?.content?.sections
        ?.find((s: { type: string }) => s.type === 'text')
        ?.body || ''

      const { data: newProject, error: projectError } = await supabase
        .from('agency_projects')
        .insert({
          name: proposalDetails.title,
          client_id: proposalDetails.client_id,
          status: 'planning',
          type: 'web',
          description: projectDescription.substring(0, 500)
        })
        .select('id, name')
        .single()

      if (projectError) {
        console.error('[signProposal] Project creation error:', projectError)
        // Non-critical, continue
      } else if (newProject) {
        projectId = newProject.id
        projectName = newProject.name

        // Link project to proposal
        await supabase
          .from('proposals')
          .update({ project_id: newProject.id })
          .eq('id', proposal.id)

        // Link project to contract doc
        await supabase
          .from('contract_docs')
          .update({ project_id: newProject.id })
          .eq('source_id', proposal.id)
          .eq('source_table', 'proposals')

        console.log('[signProposal] Auto-created project:', newProject.id)
      }
    }

    if (proposalDetails) {
      const projectData = Array.isArray(proposalDetails.agency_projects)
        ? proposalDetails.agency_projects[0]
        : proposalDetails.agency_projects

      // Use existing project data if available, otherwise use newly created
      const notifyProjectName = projectData?.name || projectName
      const notifyOwnerId = projectData?.assigned_to

      if (notifyOwnerId) {
        await notifyProposalSigned(
          proposal.id,
          proposalDetails.title,
          notifyProjectName,
          notifyOwnerId
        )
      }

      // Send confirmation email to signer
      try {
        const portalUrl = `/portal/${input.token}`
        await sendProposalSignedEmail({
          to: input.signerEmail,
          recipientName: input.signerName,
          proposalTitle: proposalDetails.title,
          portalUrl
        })
        console.log('[signProposal] Confirmation email sent to:', input.signerEmail)
      } catch (emailError) {
        console.error('[signProposal] Confirmation email error:', emailError)
        // Non-critical, continue
      }
    }

    return {
      success: true,
      message: 'Proposal signed successfully',
      signedAt: now
    }
  } catch (error) {
    console.error('[signProposal] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}
