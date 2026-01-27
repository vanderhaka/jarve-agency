'use server'

import { revalidatePath } from 'next/cache'
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
  completeMilestone,
} from '@/lib/milestones/data'
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@/lib/milestones/types'

export async function createMilestoneAction(input: CreateMilestoneInput) {
  try {
    const milestone = await createMilestone(input)
    revalidatePath(`/admin/projects/${input.project_id}`)
    return { success: true, milestone }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateMilestoneAction(
  milestoneId: string,
  projectId: string,
  input: UpdateMilestoneInput
) {
  try {
    const milestone = await updateMilestone(milestoneId, input)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, milestone }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteMilestoneAction(milestoneId: string, projectId: string) {
  try {
    await deleteMilestone(milestoneId)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function reorderMilestonesAction(projectId: string, orderedIds: string[]) {
  try {
    await reorderMilestones(projectId, orderedIds)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function completeMilestoneAction(milestoneId: string, projectId: string) {
  try {
    const milestone = await completeMilestone(milestoneId)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, milestone }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
