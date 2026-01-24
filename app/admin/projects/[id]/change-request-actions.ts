'use server'

import { revalidatePath } from 'next/cache'
import {
  createChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
  sendChangeRequest,
  archiveChangeRequest,
} from '@/lib/change-requests/data'
import type { CreateChangeRequestInput, UpdateChangeRequestInput } from '@/lib/change-requests/types'

export async function createChangeRequestAction(input: CreateChangeRequestInput) {
  try {
    const changeRequest = await createChangeRequest(input)
    revalidatePath(`/admin/projects/${input.project_id}`)
    return { success: true, changeRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function updateChangeRequestAction(
  changeRequestId: string,
  projectId: string,
  input: UpdateChangeRequestInput
) {
  try {
    const changeRequest = await updateChangeRequest(changeRequestId, input)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, changeRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteChangeRequestAction(changeRequestId: string, projectId: string) {
  try {
    await deleteChangeRequest(changeRequestId)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function sendChangeRequestAction(changeRequestId: string, projectId: string) {
  try {
    const changeRequest = await sendChangeRequest(changeRequestId)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, changeRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function archiveChangeRequestAction(changeRequestId: string, projectId: string) {
  try {
    const changeRequest = await archiveChangeRequest(changeRequestId)
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, changeRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
