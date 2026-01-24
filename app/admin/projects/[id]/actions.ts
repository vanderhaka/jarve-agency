'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createTask, updateTask, deleteTask, moveTask } from '@/lib/tasks/data'
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/tasks/types'

export async function createTaskAction(input: CreateTaskInput) {
  try {
    const task = await createTask(input)
    revalidatePath(`/app/projects/${input.project_id}`)
    return { success: true, task }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateTaskAction(taskId: string, projectId: string, input: UpdateTaskInput) {
  try {
    const task = await updateTask(taskId, input)
    revalidatePath(`/app/projects/${projectId}`)
    return { success: true, task }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  try {
    await deleteTask(taskId)
    revalidatePath(`/app/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function moveTaskAction(
  taskId: string,
  projectId: string,
  newStatus: TaskStatus,
  prevPosition: number | null,
  nextPosition: number | null
) {
  try {
    const task = await moveTask(taskId, newStatus, prevPosition, nextPosition)
    revalidatePath(`/app/projects/${projectId}`)
    return { success: true, task }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================
// Project Status Actions with Contract Gate
// ============================================================

export interface ContractStatus {
  hasMSA: boolean
  msaStatus: string | null
  hasSignedProposal: boolean
  proposalStatus: string | null
  canActivate: boolean
  missingItems: string[]
}

/**
 * Check if a project has the required contracts to be set to Active status.
 * Requires:
 * 1. Client has a signed MSA
 * 2. Project has at least one signed proposal (SOW)
 */
export async function checkProjectContractStatus(projectId: string): Promise<ContractStatus> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get project with client info
  const { data: project, error: projectError } = await supabase
    .from('agency_projects')
    .select('id, client_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return {
      hasMSA: false,
      msaStatus: null,
      hasSignedProposal: false,
      proposalStatus: null,
      canActivate: false,
      missingItems: ['Project not found']
    }
  }

  const missingItems: string[] = []
  let hasMSA = false
  let msaStatus: string | null = null
  let hasSignedProposal = false
  let proposalStatus: string | null = null

  // Check MSA status for client
  if (project.client_id) {
    const { data: msa } = await supabase
      .from('client_msas')
      .select('id, status')
      .eq('client_id', project.client_id)
      .single()

    if (msa) {
      msaStatus = msa.status
      hasMSA = msa.status === 'signed'
      if (!hasMSA) {
        missingItems.push('MSA not signed')
      }
    } else {
      missingItems.push('No MSA created for client')
    }
  } else {
    missingItems.push('No client linked to project')
  }

  // Check for signed proposal (SOW)
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('status', 'signed')
    .limit(1)

  if (proposals && proposals.length > 0) {
    hasSignedProposal = true
    proposalStatus = 'signed'
  } else {
    // Check if any proposal exists at all
    const { data: anyProposal } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('project_id', projectId)
      .limit(1)
      .single()

    if (anyProposal) {
      proposalStatus = anyProposal.status
      missingItems.push('Proposal not signed')
    } else {
      missingItems.push('No proposal created for project')
    }
  }

  return {
    hasMSA,
    msaStatus,
    hasSignedProposal,
    proposalStatus,
    canActivate: hasMSA && hasSignedProposal,
    missingItems
  }
}

/**
 * Update project status with contract gate enforcement.
 * Prevents setting status to 'in_progress' (Active) without signed MSA + SOW.
 */
export async function updateProjectStatus(
  projectId: string,
  newStatus: string
): Promise<{ success: boolean; message: string; contractStatus?: ContractStatus }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // If trying to set to active/in_progress, check contract requirements
  if (newStatus === 'in_progress' || newStatus === 'active') {
    const contractStatus = await checkProjectContractStatus(projectId)

    if (!contractStatus.canActivate) {
      return {
        success: false,
        message: `Cannot activate project: ${contractStatus.missingItems.join(', ')}`,
        contractStatus
      }
    }
  }

  // Update project status
  const { error } = await supabase
    .from('agency_projects')
    .update({ status: newStatus })
    .eq('id', projectId)

  if (error) {
    console.error('[updateProjectStatus] Error:', error)
    return { success: false, message: 'Failed to update project status' }
  }

  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePath('/admin/projects')

  return { success: true, message: 'Project status updated' }
}
