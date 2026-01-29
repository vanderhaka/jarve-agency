'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface ConvertLeadInput {
  projectName: string
  projectType: 'web' | 'mobile' | 'branding' | 'marketing' | 'other'
  projectStatus: 'planning' | 'in_progress' | 'review' | 'completed'
  assignedTo?: string | null
}

export interface ConvertLeadResult {
  success: boolean
  message: string
  clientId?: string
  projectId?: string
}

/**
 * Converts a lead to a project + client in one action.
 *
 * Flow:
 * 1. Validate lead has name + email
 * 2. Find or create client by email (case-insensitive)
 * 3. Auto-create client_user from lead contact data
 * 4. Create new project linked to client
 * 5. Update lead: status='converted', archived_at=now(), etc.
 */
export async function convertLeadToProject(
  leadId: string,
  input: ConvertLeadInput
): Promise<ConvertLeadResult> {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get current employee for archived_by
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    return { success: false, message: 'Employee not found' }
  }

  // Step 1: Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { success: false, message: 'Lead not found' }
  }

  // Step 2: Validate lead has required fields
  if (!lead.name || !lead.name.trim()) {
    return { success: false, message: 'Lead must have a name to convert' }
  }

  if (!lead.email || !lead.email.trim()) {
    return { success: false, message: 'Lead must have an email to convert' }
  }

  // Check if already converted
  if (lead.converted_at) {
    return { success: false, message: 'This lead has already been converted' }
  }

  // Check for a signed proposal before allowing conversion
  const { data: signedProposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('lead_id', leadId)
    .eq('status', 'signed')
    .limit(1)
    .maybeSingle()

  if (!signedProposal) {
    return { success: false, message: 'A proposal must be sent and signed before converting to a project' }
  }

  const leadEmail = lead.email.toLowerCase().trim()
  const now = new Date().toISOString()

  try {
    // Step 3: Find existing client by email (case-insensitive)
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, name')
      .ilike('email', leadEmail)
      .is('deleted_at', null)
      .single()

    let clientId: string

    if (existingClient) {
      // Use existing client
      clientId = existingClient.id
    } else {
      // Step 4: Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: lead.name,
          email: lead.email.trim(),
          company: lead.company || null,
          status: 'active',
        })
        .select('id')
        .single()

      if (clientError || !newClient) {
        console.error('[convertLeadToProject] Client creation failed:', clientError)
        return { success: false, message: 'Failed to create client' }
      }

      clientId = newClient.id
    }

    // Step 5: Auto-create client_user (first contact for this client)
    const { error: clientUserError } = await supabase
      .from('client_users')
      .insert({
        client_id: clientId,
        name: lead.name,
        email: lead.email.trim(),
      })

    if (clientUserError) {
      console.error('[convertLeadToProject] Client user creation failed:', clientUserError)
      // Continue anyway - client user creation is not critical for conversion
    }

    // Step 6: Create new project
    const { data: newProject, error: projectError } = await supabase
      .from('agency_projects')
      .insert({
        name: input.projectName || lead.name,
        type: input.projectType,
        status: input.projectStatus,
        client_id: clientId,
        assigned_to: input.assignedTo || null,
        description: lead.message || null,
      })
      .select('id')
      .single()

    if (projectError || !newProject) {
      console.error('[convertLeadToProject] Project creation failed:', projectError)
      return { success: false, message: 'Failed to create project' }
    }

    // Step 7: Update the lead with conversion data
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        client_id: clientId,
        project_id: newProject.id,
        converted_at: now,
        archived_at: now,
        archived_by: employee.id,
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('[convertLeadToProject] Lead update failed:', updateError)
      return { success: false, message: 'Failed to update lead status' }
    }

    // Revalidate all affected paths
    revalidatePath('/admin/leads')
    revalidatePath(`/admin/leads/${leadId}`)
    revalidatePath('/admin/clients')
    revalidatePath('/admin/projects')

    return {
      success: true,
      message: existingClient
        ? `Lead converted! Linked to existing client "${existingClient.name}"`
        : 'Lead converted successfully! New client and project created.',
      clientId,
      projectId: newProject.id,
    }

  } catch (error) {
    console.error('[convertLeadToProject] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

/**
 * Archive a lead without converting it (e.g., lead went cold).
 */
export async function archiveLead(leadId: string): Promise<{ success: boolean; message: string }> {
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

  const { error } = await supabase
    .from('leads')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: employee.id,
    })
    .eq('id', leadId)
    .is('archived_at', null) // Only archive if not already archived

  if (error) {
    console.error('[archiveLead] Error:', error)
    return { success: false, message: 'Failed to archive lead' }
  }

  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${leadId}`)

  return { success: true, message: 'Lead archived successfully' }
}

/**
 * Restore an archived lead (undo archive).
 */
export async function restoreLead(leadId: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Can only restore if not converted
  const { data: lead } = await supabase
    .from('leads')
    .select('converted_at')
    .eq('id', leadId)
    .single()

  if (lead?.converted_at) {
    return { success: false, message: 'Cannot restore a converted lead' }
  }

  const { error } = await supabase
    .from('leads')
    .update({
      archived_at: null,
      archived_by: null,
    })
    .eq('id', leadId)

  if (error) {
    console.error('[restoreLead] Error:', error)
    return { success: false, message: 'Failed to restore lead' }
  }

  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${leadId}`)

  return { success: true, message: 'Lead restored successfully' }
}
