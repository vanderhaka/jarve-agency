'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireEmployee } from '@/lib/auth/require-employee'
import { unwrapJoinResult } from '@/lib/types/action-result'
import type { CreateProposalInput, ProposalContent, ProposalSection } from './types'

// ============================================================
// Create Proposal
// ============================================================

export async function createProposal(input: CreateProposalInput) {
  const { supabase, employee } = await requireEmployee()

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
// Archive Proposal
// ============================================================

export async function archiveProposal(proposalId: string) {
  const { supabase, employee } = await requireEmployee()

  // Get proposal with authorization data
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, created_by, project:agency_projects(assigned_to)')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return { success: false, message: 'Proposal not found' }
  }

  // Authorization check: user must be creator or project owner
  const projectData = unwrapJoinResult(proposal.project)
  const isCreator = proposal.created_by === employee.id
  const isProjectAssignee = projectData?.assigned_to === employee.id
  if (!isCreator && !isProjectAssignee) {
    return { success: false, message: 'Unauthorized to archive this proposal' }
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
  const { supabase, employee } = await requireEmployee()

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      lead:leads(id, name, email, company),
      client:clients(id, name, email),
      project:agency_projects(id, name, assigned_to),
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

  // Authorization check: user must be creator or project owner
  const projectData = unwrapJoinResult(proposal.project)
  const isCreator = proposal.created_by === employee.id
  const isProjectAssignee = projectData?.assigned_to === employee.id
  if (!isCreator && !isProjectAssignee) {
    return { success: false, message: 'Unauthorized to view this proposal', proposal: null }
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
  const { supabase } = await requireEmployee()

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
