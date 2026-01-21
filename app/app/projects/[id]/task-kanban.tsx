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
import { TaskWithAssignee, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { moveTaskAction } from './actions'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
  onTaskClick?: (task: TaskWithAssignee) => void
  onAddTask?: (status: TaskStatus) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Colored header backgrounds for each status
const statusHeaderColors: Record<TaskStatus, string> = {
  'Backlog': 'bg-gray-200 text-gray-700',
  'Ready': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Review': 'bg-purple-100 text-purple-800',
  'QA': 'bg-orange-100 text-orange-800',
  'Done': 'bg-emerald-100 text-emerald-800',
  'Blocked': 'bg-red-100 text-red-800',
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

// Priority indicators: low = nothing, medium = !, high = !!, urgent = !!!
const priorityIndicators: Record<string, { symbol: string; color: string }> = {
  low: { symbol: '', color: '' },
  medium: { symbol: '!', color: 'text-blue-600' },
  high: { symbol: '!!', color: 'text-amber-600' },
  urgent: { symbol: '!!!', color: 'text-red-600' },
}

function SortableTaskCard({
  task,
  onClick,
}: {
  task: TaskWithAssignee
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

  // Only show type badge for non-default values
  const showType = task.type !== 'feature'
  const priorityInfo = priorityIndicators[task.priority]
  const hasFooter = task.due_date || priorityInfo.symbol || showType || task.assignee

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab bg-white shadow-md hover:shadow-lg transition-all active:cursor-grabbing border border-gray-300 hover:border-gray-400"
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
          {hasFooter && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {showType && (
                  <Badge variant="outline" className={`text-xs font-medium ${typeColors[task.type]}`}>
                    {task.type}
                  </Badge>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {priorityInfo.symbol && (
                  <span className={`text-sm font-bold ${priorityInfo.color}`}>
                    {priorityInfo.symbol}
                  </span>
                )}
                {task.assignee && (
                  <div
                    className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium"
                    title={task.assignee.name}
                  >
                    {getInitials(task.assignee.name)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCardOverlay({ task }: { task: TaskWithAssignee }) {
  const showType = task.type !== 'feature'
  const priorityInfo = priorityIndicators[task.priority]
  const hasFooter = task.due_date || priorityInfo.symbol || showType || task.assignee

  return (
    <Card className="cursor-grabbing shadow-xl rotate-2 bg-white border border-gray-300">
      <CardContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-2 text-gray-900">{task.title}</p>
          {hasFooter && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {showType && (
                  <Badge variant="outline" className={`text-xs font-medium ${typeColors[task.type]}`}>
                    {task.type}
                  </Badge>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {priorityInfo.symbol && (
                  <span className={`text-sm font-bold ${priorityInfo.color}`}>
                    {priorityInfo.symbol}
                  </span>
                )}
                {task.assignee && (
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {getInitials(task.assignee.name)}
                  </div>
                )}
              </div>
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
  tasks: TaskWithAssignee[]
  onTaskClick?: (task: TaskWithAssignee) => void
  onAddTask?: () => void
  isOver?: boolean
}) {
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
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
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

export function TaskKanban({ projectId, tasksByStatus, onTaskClick, onAddTask }: Props) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null)
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

  function findTask(id: string): TaskWithAssignee | undefined {
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
