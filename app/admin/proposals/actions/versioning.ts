'use server'

import { revalidatePath } from 'next/cache'
import { requireEmployee } from '@/lib/auth/require-employee'
import { unwrapJoinResult } from '@/lib/types/action-result'
import type { UpdateProposalInput } from './types'

// ============================================================
// Update Proposal (creates new version on every edit)
// ============================================================

export async function updateProposal(proposalId: string, input: UpdateProposalInput) {
  const { supabase, employee } = await requireEmployee()

  console.log('[updateProposal] Starting update for proposalId:', proposalId, 'employeeId:', employee.id)

  // Get current proposal with authorization data
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, current_version, status, created_by, project:agency_projects(assigned_to)')
    .eq('id', proposalId)
    .single()

  console.log('[updateProposal] Query result:', { proposal, proposalError })

  if (proposalError || !proposal) {
    console.log('[updateProposal] Proposal not found - error:', proposalError, 'proposal:', proposal)
    return { success: false, message: 'Proposal not found' }
  }

  // Authorization check: user must be creator or project assignee
  const projectData = unwrapJoinResult(proposal.project)
  const isCreator = proposal.created_by === employee.id
  const isProjectAssignee = projectData?.assigned_to === employee.id
  if (!isCreator && !isProjectAssignee) {
    return { success: false, message: 'Unauthorized to modify this proposal' }
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
