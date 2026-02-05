'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Task, TaskWithAssignee, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { TaskList } from './task-list'
import { TaskDetailSheet } from './task-detail-sheet'
import { TaskFilters, TaskFiltersState, filterTasks } from './task-filters'
import { NewTaskDialog } from './new-task-dialog'

// Dynamic import to prevent SSR hydration issues with dnd-kit
const TaskKanban = dynamic(() => import('./kanban').then(mod => mod.TaskKanban), {
  ssr: false,
  loading: () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {['Backlog', 'Ready', 'In Progress', 'In Review', 'Done'].map(status => (
        <div key={status} className="flex flex-col rounded-lg bg-gray-50/80 border border-gray-200 min-w-[280px] max-w-[280px] overflow-hidden animate-pulse">
          <div className="px-3 py-3 bg-gray-200">
            <div className="h-5 w-20 bg-gray-300 rounded" />
          </div>
          <div className="flex-1 p-2 space-y-2 min-h-[200px]">
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  ),
})

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
