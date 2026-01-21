'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { moveTaskAction } from './actions'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, Task[]>
  onTaskClick?: (task: Task) => void
  onAddTask?: (status: TaskStatus) => void
}

// Colored left border only - clean neutral columns
const statusBorderColors: Record<TaskStatus, string> = {
  'Backlog': 'border-l-gray-400',
  'Ready': 'border-l-blue-500',
  'In Progress': 'border-l-amber-500',
  'Review': 'border-l-purple-500',
  'QA': 'border-l-orange-500',
  'Done': 'border-l-emerald-500',
  'Blocked': 'border-l-red-500',
}

// Higher contrast badge colors
const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-300',
  medium: 'bg-sky-100 text-sky-700 border-sky-300',
  high: 'bg-amber-100 text-amber-700 border-amber-400',
  urgent: 'bg-red-100 text-red-700 border-red-400',
}

const typeColors: Record<string, string> = {
  feature: 'bg-emerald-100 text-emerald-700 border-emerald-400',
  bug: 'bg-rose-100 text-rose-700 border-rose-400',
  chore: 'bg-slate-100 text-slate-600 border-slate-300',
  spike: 'bg-violet-100 text-violet-700 border-violet-400',
}

function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task
  onClick?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Only show badges for non-default values
  const showType = task.type !== 'feature'
  const showPriority = task.priority !== 'medium'
  const hasBadges = showType || showPriority

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab bg-white shadow-sm hover:shadow-md transition-all active:cursor-grabbing border-0 ring-1 ring-gray-200 hover:ring-gray-300"
      {...attributes}
      {...listeners}
      onClick={e => {
        // Only trigger click if not dragging
        if (!isDragging) {
          e.stopPropagation()
          onClick?.()
        }
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-2 text-gray-900">{task.title}</p>
          {hasBadges && (
            <div className="flex flex-wrap gap-1.5">
              {showType && (
                <Badge variant="outline" className={`text-xs font-medium ${typeColors[task.type]}`}>
                  {task.type}
                </Badge>
              )}
              {showPriority && (
                <Badge variant="outline" className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority}
                </Badge>
              )}
            </div>
          )}
          {task.due_date && (
            <p className="text-xs text-gray-500">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCardOverlay({ task }: { task: Task }) {
  const showType = task.type !== 'feature'
  const showPriority = task.priority !== 'medium'
  const hasBadges = showType || showPriority

  return (
    <Card className="cursor-grabbing shadow-xl rotate-2 bg-white border-0 ring-1 ring-gray-200">
      <CardContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-2 text-gray-900">{task.title}</p>
          {hasBadges && (
            <div className="flex flex-wrap gap-1.5">
              {showType && (
                <Badge variant="outline" className={`text-xs font-medium ${typeColors[task.type]}`}>
                  {task.type}
                </Badge>
              )}
              {showPriority && (
                <Badge variant="outline" className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
  isOver,
}: {
  status: TaskStatus
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onAddTask?: () => void
  isOver?: boolean
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg bg-gray-50/80 border border-gray-200 border-l-4 ${statusBorderColors[status]} min-w-[280px] max-w-[280px] transition-all ${
        isOver ? 'bg-gray-100 ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="px-3 py-3 border-b border-gray-200/60">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{status}</h3>
          <span className="text-xs font-medium text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
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
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <div className="w-8 h-8 rounded-full bg-gray-200/60 flex items-center justify-center mb-2">
                <Plus className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400">No tasks yet</p>
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </SortableContext>
        {onAddTask && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add task
          </Button>
        )}
      </div>
    </div>
  )
}

export function TaskKanban({ projectId, tasksByStatus, onTaskClick, onAddTask }: Props) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localTasksByStatus, setLocalTasksByStatus] = useState(tasksByStatus)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  // Sync local state when props change (e.g., after task creation)
  useEffect(() => {
    setLocalTasksByStatus(tasksByStatus)
  }, [tasksByStatus])

  // Use pointer sensor with some activation delay to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const task = findTask(active.id as string)
    setActiveTask(task || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (!over) {
      setOverColumn(null)
      return
    }

    // Check if over a column directly
    if (TASK_STATUSES.includes(over.id as TaskStatus)) {
      setOverColumn(over.id as TaskStatus)
      return
    }

    // Check if over a task - find which column it's in
    const status = findTaskStatus(over.id as string)
    setOverColumn(status || null)
  }

  function findTask(id: string): Task | undefined {
    for (const status of TASK_STATUSES) {
      const task = localTasksByStatus[status].find(t => t.id === id)
      if (task) return task
    }
    return undefined
  }

  function findTaskStatus(id: string): TaskStatus | undefined {
    for (const status of TASK_STATUSES) {
      if (localTasksByStatus[status].some(t => t.id === id)) {
        return status
      }
    }
    return undefined
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setOverColumn(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeStatus = findTaskStatus(activeId)
    let overStatus = findTaskStatus(overId)

    // If dropped on a column (status), overId will be a status name
    if (TASK_STATUSES.includes(overId as TaskStatus)) {
      overStatus = overId as TaskStatus
    }

    if (!activeStatus || !overStatus) return

    // Find positions for fractional ordering
    const targetTasks = localTasksByStatus[overStatus]
    const overIndex = targetTasks.findIndex(t => t.id === overId)

    let prevPosition: number | null = null
    let nextPosition: number | null = null

    if (activeStatus === overStatus) {
      // Moving within same column
      const activeIndex = targetTasks.findIndex(t => t.id === activeId)
      if (activeIndex === overIndex) return // No change

      if (overIndex > activeIndex) {
        // Moving down
        prevPosition = targetTasks[overIndex]?.position ?? null
        nextPosition = targetTasks[overIndex + 1]?.position ?? null
      } else {
        // Moving up
        prevPosition = targetTasks[overIndex - 1]?.position ?? null
        nextPosition = targetTasks[overIndex]?.position ?? null
      }
    } else {
      // Moving to different column
      if (overIndex === -1) {
        // Dropped on empty column or after last item
        if (targetTasks.length > 0) {
          prevPosition = targetTasks[targetTasks.length - 1].position
        }
      } else {
        // Dropped on a specific task
        prevPosition = overIndex > 0 ? targetTasks[overIndex - 1].position : null
        nextPosition = targetTasks[overIndex].position
      }
    }

    // Optimistic update
    const updatedTasksByStatus = { ...localTasksByStatus }
    const task = findTask(activeId)
    if (!task) return

    // Remove from old status
    updatedTasksByStatus[activeStatus] = updatedTasksByStatus[activeStatus].filter(
      t => t.id !== activeId
    )

    // Calculate new position
    let newPosition: number
    if (prevPosition !== null && nextPosition !== null) {
      newPosition = (prevPosition + nextPosition) / 2
    } else if (prevPosition !== null) {
      newPosition = prevPosition + 1
    } else if (nextPosition !== null) {
      newPosition = nextPosition - 1
    } else {
      newPosition = 1
    }

    // Add to new status with updated position
    const updatedTask = { ...task, status: overStatus, position: newPosition }
    const insertIndex =
      overIndex === -1
        ? updatedTasksByStatus[overStatus].length
        : activeStatus === overStatus && overIndex > localTasksByStatus[activeStatus].findIndex(t => t.id === activeId)
        ? overIndex
        : overIndex

    updatedTasksByStatus[overStatus].splice(insertIndex, 0, updatedTask)

    // Sort by position
    updatedTasksByStatus[overStatus].sort((a, b) => a.position - b.position)

    setLocalTasksByStatus(updatedTasksByStatus)

    // Persist to database
    const result = await moveTaskAction(
      activeId,
      projectId,
      overStatus,
      prevPosition,
      nextPosition
    )

    if (!result.success) {
      // Revert on failure
      setLocalTasksByStatus(tasksByStatus)
      toast.error(`Failed to move task: ${result.error}`)
    } else {
      router.refresh()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {TASK_STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={localTasksByStatus[status]}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask ? () => onAddTask(status) : undefined}
            isOver={overColumn === status}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
