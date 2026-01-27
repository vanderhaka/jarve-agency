'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskWithAssignee, TaskStatus } from '@/lib/tasks/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SortableTaskCard } from './task-card'

// Colored header backgrounds for each status
export const statusHeaderColors: Record<TaskStatus, string> = {
  'Backlog': 'bg-gray-200 text-gray-700',
  'Ready': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Review': 'bg-purple-100 text-purple-800',
  'QA': 'bg-orange-100 text-orange-800',
  'Done': 'bg-emerald-100 text-emerald-800',
  'Blocked': 'bg-red-100 text-red-800',
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: TaskWithAssignee[]
  onTaskClick?: (task: TaskWithAssignee) => void
  onAddTask?: () => void
  isOver?: boolean
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
  isOver,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg bg-gray-50/80 border border-gray-200 min-w-[280px] max-w-[280px] transition-all overflow-hidden ${
        isOver ? 'bg-gray-100 ring-2 ring-primary/20' : ''
      }`}
    >
      <div className={`px-3 py-3 ${statusHeaderColors[status]}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{status}</h3>
          <span className="text-lg font-bold opacity-60">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            onAddTask ? (
              <button
                onClick={onAddTask}
                className="flex flex-col items-center justify-center w-full h-32 text-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100/50 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="h-5 w-5 text-gray-500 group-hover:text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 group-hover:text-gray-600 font-medium">Add a task</p>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <p className="text-xs text-gray-400">No tasks yet</p>
              </div>
            )
          ) : (
            <>
              {tasks.map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
              {onAddTask && (
                <Button
                  variant="success"
                  size="sm"
                  className="w-full justify-center"
                  onClick={onAddTask}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add task
                </Button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
