'use server'

import { revalidatePath } from 'next/cache'
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
