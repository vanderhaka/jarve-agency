'use client'

import { Task, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { TaskKanban } from './task-kanban'
import { TaskList } from './task-list'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, Task[]>
  currentView: 'list' | 'kanban'
}

export function TasksView({ projectId, tasksByStatus, currentView }: Props) {
  // Flatten tasks for list view
  const allTasks = TASK_STATUSES.flatMap(status => tasksByStatus[status])

  if (currentView === 'list') {
    return <TaskList projectId={projectId} tasks={allTasks} />
  }

  return <TaskKanban projectId={projectId} tasksByStatus={tasksByStatus} />
}
