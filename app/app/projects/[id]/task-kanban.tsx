'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { moveTaskAction } from './actions'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, Task[]>
  onTaskClick?: (task: Task) => void
}

const statusColors: Record<TaskStatus, string> = {
  'Backlog': 'bg-gray-100 border-gray-300',
  'Ready': 'bg-blue-50 border-blue-300',
  'In Progress': 'bg-yellow-50 border-yellow-300',
  'Review': 'bg-purple-50 border-purple-300',
  'QA': 'bg-orange-50 border-orange-300',
  'Done': 'bg-green-50 border-green-300',
  'Blocked': 'bg-red-50 border-red-300',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const typeColors: Record<string, string> = {
  feature: 'bg-green-100 text-green-700',
  bug: 'bg-red-100 text-red-700',
  chore: 'bg-gray-100 text-gray-700',
  spike: 'bg-purple-100 text-purple-700',
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
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
          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={typeColors[task.type]}>
              {task.type}
            </Badge>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
          {task.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <Card className="cursor-grabbing shadow-lg rotate-3">
      <CardContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={typeColors[task.type]}>
              {task.type}
            </Badge>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}) {
  return (
    <div
      className={`flex flex-col rounded-lg border-2 ${statusColors[status]} min-w-[280px] max-w-[280px]`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {status}
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2 space-y-2 min-h-[200px]">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-md">
              No tasks
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
      </CardContent>
    </div>
  )
}

export function TaskKanban({ projectId, tasksByStatus, onTaskClick }: Props) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localTasksByStatus, setLocalTasksByStatus] = useState(tasksByStatus)

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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={localTasksByStatus[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
