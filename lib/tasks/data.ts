import { createClient } from '@/utils/supabase/server'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskWithAssignee } from './types'
import { calculateNewPosition } from './position'

/**
 * Get all tasks for a project, ordered by status and position
 * Includes assignee info from employees table
 */
export async function getTasksByProject(projectId: string): Promise<TaskWithAssignee[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:employees!assignee_id (
        id,
        name,
        email
      )
    `)
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data as TaskWithAssignee[]
}

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

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch task: ${error.message}`)
  }

  return data as Task
}

/**
 * Create a new task
 * Position defaults to end of the status column
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = await createClient()

  // Get max position for this project/status to place new task at end
  const status = input.status ?? 'Backlog'
  const { data: maxPosData } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', input.project_id)
    .eq('status', status)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = input.position ?? ((maxPosData?.position ?? 0) + 1)

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...input,
      status,
      type: input.type ?? 'feature',
      priority: input.priority ?? 'medium',
      position,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return data as Task
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return data as Task
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}

/**
 * Move a task to a new position and/or status
 * Uses fractional positioning for efficient reordering
 *
 * @param taskId - The task to move
 * @param newStatus - The target status column
 * @param prevPosition - Position of the task above (null if moving to top)
 * @param nextPosition - Position of the task below (null if moving to bottom)
 */
export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  prevPosition: number | null,
  nextPosition: number | null
): Promise<Task> {
  const newPosition = calculateNewPosition(prevPosition, nextPosition)

  return updateTask(taskId, {
    status: newStatus,
    position: newPosition,
  })
}

/**
 * Get task counts by status for a project (for summary panel)
 */
export async function getTaskCounts(projectId: string): Promise<Record<TaskStatus, number>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)

  if (error) {
    throw new Error(`Failed to fetch task counts: ${error.message}`)
  }

  const counts: Record<TaskStatus, number> = {
    'Backlog': 0,
    'Ready': 0,
    'In Progress': 0,
    'Review': 0,
    'QA': 0,
    'Done': 0,
    'Blocked': 0,
  }

  for (const task of data) {
    counts[task.status as TaskStatus]++
  }

  return counts
}

/**
 * Get count of overdue tasks (past due_date and not Done)
 */
export async function getOverdueCount(projectId: string): Promise<number> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .lt('due_date', today)
    .neq('status', 'Done')

  if (error) {
    throw new Error(`Failed to fetch overdue count: ${error.message}`)
  }

  return count ?? 0
}
