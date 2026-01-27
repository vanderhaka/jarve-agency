'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { TaskWithAssignee, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { toast } from 'sonner'
import { moveTaskAction } from '../actions'

interface UseKanbanDndProps {
  projectId: string
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
}

export function useKanbanDnd({ projectId, tasksByStatus }: UseKanbanDndProps) {
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

  return {
    sensors,
    activeTask,
    localTasksByStatus,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
