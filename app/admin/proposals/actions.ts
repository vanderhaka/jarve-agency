'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { notifyProposalSigned } from '@/lib/notifications/actions'
import { sendProposalEmail, sendProposalSignedEmail } from '@/lib/email/resend'

// ============================================================
// Types
// ============================================================

export interface ProposalSection {
  id: string
  type: 'text' | 'list' | 'pricing' | 'image'
  title: string
  body?: string
  items?: string[]
  order: number
}

export interface PricingLineItem {
  id: string
  label: string
  description?: string
  qty: number
  unitPrice: number
  total: number
}

export interface ProposalContent {
  sections: ProposalSection[]
  pricing: {
    lineItems: PricingLineItem[]
    subtotal: number
    gstRate: number
    gstAmount: number
    total: number
  }
  terms: string
}

export interface CreateProposalInput {
  leadId?: string
  projectId?: string
  clientId?: string
  title: string
  templateId?: string
}

export interface UpdateProposalInput {
  content: ProposalContent
}

export interface SendProposalInput {
  clientUserId: string
  version?: number // If not provided, uses current version
}

export interface SignProposalInput {
  token: string
  signerName: string
  signerEmail: string
  signatureSvg: string
  ipAddress?: string
}

// ============================================================
// Create Proposal
// ============================================================

export async function createProposal(input: CreateProposalInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    return { success: false, message: 'Employee not found' }
  }

  // Determine client_id
  let clientId = input.clientId

  // If we have a project, get client from project
  if (input.projectId && !clientId) {
    const { data: project } = await supabase
      .from('agency_projects')
      .select('client_id')
      .eq('id', input.projectId)
      .single()

    if (project?.client_id) {
      clientId = project.client_id
    }
  }

  // If we have a lead, get client from lead (if converted)
  if (input.leadId && !clientId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('client_id')
      .eq('id', input.leadId)
      .single()

    if (lead?.client_id) {
      clientId = lead.client_id
    }
  }

  // Get template content if provided
  const initialContent: ProposalContent = {
    sections: [],
    pricing: {
      lineItems: [],
      subtotal: 0,
      gstRate: 0.10,
      gstAmount: 0,
      total: 0
    },
    terms: ''
  }

  if (input.templateId) {
    const { data: template } = await supabase
      .from('proposal_templates')
      .select('sections, default_terms')
      .eq('id', input.templateId)
      .single()

    if (template) {
      initialContent.sections = template.sections as ProposalSection[]
      initialContent.terms = template.default_terms ? template.default_terms : ''
    }
  } else {
    // Use default template
    const { data: defaultTemplate } = await supabase
      .from('proposal_templates')
      .select('sections, default_terms')
      .eq('is_default', true)
      .single()

    if (defaultTemplate) {
      initialContent.sections = defaultTemplate.sections as ProposalSection[]
      initialContent.terms = defaultTemplate.default_terms || ''
    }
  }

  try {
    // Create the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        lead_id: input.leadId || null,
        project_id: input.projectId || null,
        client_id: clientId || null,
        title: input.title,
        status: 'draft',
        current_version: 1,
        created_by: employee.id
      })
      .select('id')
      .single()

    if (proposalError || !proposal) {
      console.error('[createProposal] Error:', proposalError)
      return { success: false, message: 'Failed to create proposal' }
    }

    // Create version 1
    const { error: versionError } = await supabase
      .from('proposal_versions')
      .insert({
        proposal_id: proposal.id,
        version: 1,
        content: initialContent,
        subtotal: initialContent.pricing.subtotal,
        gst_rate: initialContent.pricing.gstRate,
        gst_amount: initialContent.pricing.gstAmount,
        total: initialContent.pricing.total,
        created_by: employee.id
      })

    if (versionError) {
      console.error('[createProposal] Version error:', versionError)
      // Clean up proposal
      await supabase.from('proposals').delete().eq('id', proposal.id)
      return { success: false, message: 'Failed to create proposal version' }
    }

    revalidatePath('/admin/proposals')
    if (input.projectId) revalidatePath(`/admin/projects/${input.projectId}`)
    if (input.leadId) revalidatePath(`/admin/leads/${input.leadId}`)

    return {
      success: true,
      message: 'Proposal created successfully',
      proposalId: proposal.id
    }
  } catch (error) {
    console.error('[createProposal] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Update Proposal (creates new version on every edit)
// ============================================================

export async function updateProposal(proposalId: string, input: UpdateProposalInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    return { success: false, message: 'Employee not found' }
  }

  // Get current proposal
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, current_version, status')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return { success: false, message: 'Proposal not found' }
  }

  // Cannot edit signed or archived proposals
  if (proposal.status === 'signed') {
    return { success: false, message: 'Cannot edit a signed proposal' }
  }

  if (proposal.status === 'archived') {
    return { success: false, message: 'Cannot edit an archived proposal' }
  }

  const newVersion = proposal.current_version + 1

  try {
    // Create new version
    const { error: versionError } = await supabase
      .from('proposal_versions')
      .insert({
        proposal_id: proposalId,
        version: newVersion,
        content: input.content,
        subtotal: input.content.pricing.subtotal,
        gst_rate: input.content.pricing.gstRate,
        gst_amount: input.content.pricing.gstAmount,
        total: input.content.pricing.total,
        created_by: employee.id
      })

    if (versionError) {
      console.error('[updateProposal] Version error:', versionError)
      return { success: false, message: 'Failed to create new version' }
    }

    // Update proposal current_version
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ current_version: newVersion })
      .eq('id', proposalId)

    if (updateError) {
      console.error('[updateProposal] Update error:', updateError)
      return { success: false, message: 'Failed to update proposal' }
    }

    revalidatePath('/admin/proposals')
    revalidatePath(`/admin/proposals/${proposalId}`)

    return {
      success: true,
      message: `Proposal updated (version ${newVersion})`,
      version: newVersion
    }
  } catch (error) {
    console.error('[updateProposal] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Convert Lead to Client (for sending proposals)
// ============================================================

export async function convertLeadAndSend(proposalId: string, leadId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, name, email, company')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { success: false, message: 'Lead not found' }
  }

  if (!lead.email) {
    return { success: false, message: 'Lead has no email address' }
  }

  // Check if client already exists for this lead
  let clientId: string
  const { data: existingLead } = await supabase
    .from('leads')
    .select('client_id')
    .eq('id', leadId)
    .single()

  if (existingLead?.client_id) {
    clientId = existingLead.client_id
  } else {
    // Create client from lead
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: lead.company || lead.name,
        email: lead.email,
        created_by: user.id
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      console.error('[convertLeadAndSend] Client creation error:', clientError)
      return { success: false, message: 'Failed to create client' }
    }

    clientId = newClient.id

    // Update lead with client_id and mark as converted
    await supabase
      .from('leads')
      .update({
        client_id: clientId,
        converted_at: new Date().toISOString(),
        status: 'converted'
      })
      .eq('id', leadId)
  }

  // Check if client_user exists for this email
  let clientUserId: string
  const { data: existingUser } = await supabase
    .from('client_users')
    .select('id')
    .eq('client_id', clientId)
    .eq('email', lead.email)
    .single()

  if (existingUser) {
    clientUserId = existingUser.id
  } else {
    // Create client_user
    const { data: newUser, error: userError } = await supabase
      .from('client_users')
      .insert({
        client_id: clientId,
        name: lead.name,
        email: lead.email
      })
      .select('id')
      .single()

    if (userError || !newUser) {
      console.error('[convertLeadAndSend] Client user creation error:', userError)
      return { success: false, message: 'Failed to create client contact' }
    }

    clientUserId = newUser.id
  }

  // Update proposal with client_id
  await supabase
    .from('proposals')
    .update({ client_id: clientId })
    .eq('id', proposalId)

  // Now send using the existing flow
  return sendProposal(proposalId, { clientUserId })
}

// ============================================================
// Send Proposal to Client
// ============================================================

export async function sendProposal(proposalId: string, input: SendProposalInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

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

    // Mark version as sent
    const { error: versionUpdateError } = await supabase
      .from('proposal_versions')
      .update({
        sent_at: new Date().toISOString(),
        sent_to_client_user_id: clientUser.id
      })
      .eq('proposal_id', proposalId)
      .eq('version', versionToSend)

    if (versionUpdateError) {
      console.error('[sendProposal] Version update error:', versionUpdateError)
    }

    // Update proposal status to sent
    const { error: proposalUpdateError } = await supabase
      .from('proposals')
      .update({ status: 'sent' })
      .eq('id', proposalId)

    if (proposalUpdateError) {
      console.error('[sendProposal] Proposal update error:', proposalUpdateError)
      return { success: false, message: 'Failed to update proposal status' }
    }

    // Update client_id on proposal if not set
    if (!proposal.client_id && clientUser.client_id) {
      await supabase
        .from('proposals')
        .update({ client_id: clientUser.client_id })
        .eq('id', proposalId)
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

// ============================================================
// Sign Proposal (Client Portal)
// ============================================================

export async function signProposal(input: SignProposalInput) {
  const supabase = await createClient()

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
        ip_address: input.ipAddress || null,
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
        agency_projects(name, owner_id)
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
      const notifyOwnerId = projectData?.owner_id

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

// ============================================================
// Archive Proposal
// ============================================================

export async function archiveProposal(proposalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('proposals')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString()
    })
    .eq('id', proposalId)

  if (error) {
    console.error('[archiveProposal] Error:', error)
    return { success: false, message: 'Failed to archive proposal' }
  }

  revalidatePath('/admin/proposals')
  revalidatePath(`/admin/proposals/${proposalId}`)

  return { success: true, message: 'Proposal archived' }
}

// ============================================================
// Get Proposal with Versions
// ============================================================

export async function getProposal(proposalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      lead:leads(id, name, email, company),
      client:clients(id, name, email),
      project:agency_projects(id, name),
      created_by_employee:employees!proposals_created_by_fkey(id, name, email),
      versions:proposal_versions(
        id,
        version,
        content,
        subtotal,
        gst_rate,
        gst_amount,
        total,
        pdf_path,
        sent_at,
        sent_to_client_user_id,
        created_at,
        created_by_employee:employees(id, name)
      ),
      signatures:proposal_signatures(
        id,
        signer_name,
        signer_email,
        ip_address,
        signed_at
      )
    `)
    .eq('id', proposalId)
    .single()

  if (error || !proposal) {
    return { success: false, message: 'Proposal not found', proposal: null }
  }

  return { success: true, proposal }
}

// ============================================================
// List Proposals
// ============================================================

export async function listProposals(filters?: {
  clientId?: string
  projectId?: string
  leadId?: string
  status?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('proposals')
    .select(`
      id,
      title,
      status,
      current_version,
      created_at,
      updated_at,
      signed_at,
      client:clients(id, name),
      project:agency_projects(id, name),
      lead:leads(id, name)
    `)
    .order('created_at', { ascending: false })

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }
  if (filters?.projectId) {
    query = query.eq('project_id', filters.projectId)
  }
  if (filters?.leadId) {
    query = query.eq('lead_id', filters.leadId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data: proposals, error } = await query

  if (error) {
    console.error('[listProposals] Error:', error)
    return { success: false, proposals: [] }
  }

  return { success: true, proposals }
}

// ============================================================
// Helpers
// ============================================================

function generatePortalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
