// Task types for project kanban/list views

export const TASK_STATUSES = [
  'Backlog',
  'Ready',
  'In Progress',
  'Review',
  'QA',
  'Done',
  'Blocked',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_TYPES = ['feature', 'bug', 'chore', 'spike'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

// Database row type
export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  type: TaskType
  priority: TaskPriority
  position: number
  estimate: number | null
  due_date: string | null
  assignee_id: string | null
  acceptance_criteria: string | null
  blockers: string | null
  created_at: string
  updated_at: string
}

// For creating a new task
export interface CreateTaskInput {
  project_id: string
  title: string
  description?: string | null
  status?: TaskStatus
  type?: TaskType
  priority?: TaskPriority
  position?: number
  estimate?: number | null
  due_date?: string | null
  assignee_id?: string | null
  acceptance_criteria?: string | null
  blockers?: string | null
}

// For updating a task
export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  type?: TaskType
  priority?: TaskPriority
  position?: number
  estimate?: number | null
  due_date?: string | null
  assignee_id?: string | null
  acceptance_criteria?: string | null
  blockers?: string | null
}

// For kanban columns
export interface KanbanColumn {
  status: TaskStatus
  tasks: Task[]
}

// Assignee info from employees table
export interface TaskAssignee {
  id: string
  name: string
  email: string
}

// Task with optional relations
export interface TaskWithAssignee extends Task {
  assignee?: TaskAssignee | null
}
