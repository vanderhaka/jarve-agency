import type { TaskStatus, TaskWithAssignee } from '../types'
import { getTasksByProject } from './queries'

/**
 * Get tasks grouped by status for kanban view
 */
export async function getTasksByProjectGrouped(projectId: string): Promise<Record<TaskStatus, TaskWithAssignee[]>> {
  const tasks = await getTasksByProject(projectId)

  const grouped: Record<TaskStatus, TaskWithAssignee[]> = {
    'Backlog': [],
    'Ready': [],
    'In Progress': [],
    'Review': [],
    'QA': [],
    'Done': [],
    'Blocked': [],
  }

  for (const task of tasks) {
    grouped[task.status].push(task)
  }

  return grouped
}
