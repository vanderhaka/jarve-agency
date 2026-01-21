'use client'

import { useState } from 'react'
import { Task, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { TaskKanban } from './task-kanban'
import { TaskList } from './task-list'
import { TaskDetailSheet } from './task-detail-sheet'
import { TaskFilters, TaskFiltersState, filterTasks } from './task-filters'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, Task[]>
  currentView: 'list' | 'kanban'
  filters: TaskFiltersState
}

export function TasksView({ projectId, tasksByStatus, currentView, filters }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Apply filters to tasks
  const filteredTasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = filterTasks(tasksByStatus[status], filters)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  // Flatten tasks for list view
  const allTasks = TASK_STATUSES.flatMap(status => filteredTasksByStatus[status])

  function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setSheetOpen(true)
  }

  return (
    <>
      <TaskFilters filters={filters} />

      {currentView === 'list' ? (
        <TaskList tasks={allTasks} onTaskClick={handleTaskClick} />
      ) : (
        <TaskKanban projectId={projectId} tasksByStatus={filteredTasksByStatus} onTaskClick={handleTaskClick} />
      )}

      <TaskDetailSheet
        task={selectedTask}
        projectId={projectId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
