import { createClient } from '@/utils/supabase/server'
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput, InsertMilestoneInput } from '../types'

/**
 * Get all milestones for a project, ordered by sort_order
 */
export async function getMilestonesByProject(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[getMilestonesByProject] Error:', error)
    throw new Error('Failed to fetch milestones')
  }

  return data || []
}

/**
 * Get a single milestone by ID
 */
export async function getMilestoneById(milestoneId: string): Promise<Milestone | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[getMilestoneById] Error:', error)
    throw new Error('Failed to fetch milestone')
  }

  return data
}

/**
 * Create a new milestone at the end of the list
 */
export async function createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
  const supabase = await createClient()

  // Get the max sort_order for this project
  const { data: existing } = await supabase
    .from('milestones')
    .select('sort_order')
    .eq('project_id', input.project_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('milestones')
    .insert({
      ...input,
      sort_order: nextSortOrder,
      gst_rate: input.gst_rate ?? 0.10,
      status: input.status ?? 'planned',
      is_deposit: input.is_deposit ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('[createMilestone] Error:', error)
    throw new Error('Failed to create milestone')
  }

  return data
}

/**
 * Insert a milestone at a specific position, shifting others down
 */
export async function insertMilestone(input: InsertMilestoneInput): Promise<Milestone> {
  const supabase = await createClient()
  const { position, ...milestoneData } = input

  // Shift all milestones at or after the position
  const { error: shiftError } = await supabase
    .rpc('increment_milestone_sort_order', {
      p_project_id: input.project_id,
      p_from_position: position,
    })

  // If the RPC doesn't exist, do it manually
  if (shiftError) {
    // Manual shift: increment sort_order for all milestones >= position
    const { data: toShift } = await supabase
      .from('milestones')
      .select('id, sort_order')
      .eq('project_id', input.project_id)
      .gte('sort_order', position)
      .order('sort_order', { ascending: false })

    if (toShift && toShift.length > 0) {
      for (const m of toShift) {
        await supabase
          .from('milestones')
          .update({ sort_order: m.sort_order + 1 })
          .eq('id', m.id)
      }
    }
  }

  // Insert the new milestone at the position
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      ...milestoneData,
      sort_order: position,
      gst_rate: milestoneData.gst_rate ?? 0.10,
      status: milestoneData.status ?? 'planned',
      is_deposit: milestoneData.is_deposit ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('[insertMilestone] Error:', error)
    throw new Error('Failed to insert milestone')
  }

  return data
}

/**
 * Update a milestone
 */
export async function updateMilestone(milestoneId: string, input: UpdateMilestoneInput): Promise<Milestone> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milestones')
    .update(input)
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('[updateMilestone] Error:', error)
    throw new Error('Failed to update milestone')
  }

  return data
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId)

  if (error) {
    console.error('[deleteMilestone] Error:', error)
    throw new Error('Failed to delete milestone')
  }
}

/**
 * Reorder milestones by providing an array of IDs in the desired order
 */
export async function reorderMilestones(projectId: string, orderedIds: string[]): Promise<void> {
  const supabase = await createClient()

  // Update each milestone's sort_order based on its position in the array
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('milestones')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('project_id', projectId)

    if (error) {
      console.error('[reorderMilestones] Error updating milestone:', error)
      throw new Error('Failed to reorder milestones')
    }
  }
}

/**
 * Complete a milestone (mark as complete, triggering invoice creation in Stage 5)
 * Returns the milestone - invoice creation will be handled separately
 */
export async function completeMilestone(milestoneId: string): Promise<Milestone> {
  const supabase = await createClient()

  // First check if already complete/invoiced (idempotent)
  const { data: existing, error: fetchError } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  if (fetchError || !existing) {
    throw new Error('Milestone not found')
  }

  if (existing.status === 'complete' || existing.status === 'invoiced') {
    // Already complete, return as-is (idempotent)
    return existing
  }

  // Update to complete
  const { data, error } = await supabase
    .from('milestones')
    .update({ status: 'complete' })
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('[completeMilestone] Error:', error)
    throw new Error('Failed to complete milestone')
  }

  // TODO: In Stage 5, this is where we'd create the Xero invoice
  // const invoice = await createXeroInvoice(data)
  // await supabase.from('milestones').update({ invoice_id: invoice.id, status: 'invoiced' }).eq('id', milestoneId)

  return data
}
