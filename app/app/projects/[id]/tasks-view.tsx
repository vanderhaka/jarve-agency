'use client'

import { useState } from 'react'
import { Task, TaskWithAssignee, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { TaskKanban } from './task-kanban'
import { TaskList } from './task-list'
import { TaskDetailSheet } from './task-detail-sheet'
import { TaskFilters, TaskFiltersState, filterTasks } from './task-filters'
import { NewTaskDialog } from './new-task-dialog'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
  currentView: 'list' | 'kanban'
  filters: TaskFiltersState
}

export function TasksView({ projectId, tasksByStatus, currentView, filters }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('Backlog')
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false)

  // Apply filters to tasks
  const filteredTasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = filterTasks(tasksByStatus[status], filters)
    return acc
  }, {} as Record<TaskStatus, TaskWithAssignee[]>)

  // Flatten tasks for list view
  const allTasks = TASK_STATUSES.flatMap(status => filteredTasksByStatus[status])

  function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setSheetOpen(true)
  }

  function handleAddTask(status: TaskStatus) {
    setNewTaskStatus(status)
    setNewTaskDialogOpen(true)
  }

  return (
    <>
      <TaskFilters filters={filters} />

      {currentView === 'list' ? (
        <TaskList
          tasks={allTasks}
          onTaskClick={handleTaskClick}
          onAddTask={() => handleAddTask('Backlog')}
        />
      ) : (
        <TaskKanban
          projectId={projectId}
          tasksByStatus={filteredTasksByStatus}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      )}

      <TaskDetailSheet
        task={selectedTask}
        projectId={projectId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <NewTaskDialog
        projectId={projectId}
        defaultStatus={newTaskStatus}
        open={newTaskDialogOpen}
        onOpenChange={setNewTaskDialogOpen}
        trigger={null}
      />
    </>
  )
}
