'use client'

import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import { TaskWithAssignee, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { KanbanColumn } from './kanban-column'
import { TaskCardOverlay } from './task-card'
import { useKanbanDnd } from './use-kanban-dnd'

interface TaskKanbanProps {
  projectId: string
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
  onTaskClick?: (task: TaskWithAssignee) => void
  onAddTask?: (status: TaskStatus) => void
}

export function TaskKanban({ projectId, tasksByStatus, onTaskClick, onAddTask }: TaskKanbanProps) {
  const dndId = `task-kanban-dnd-${projectId}`

  const {
    sensors,
    activeTask,
    localTasksByStatus,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useKanbanDnd({ projectId, tasksByStatus })

  return (
    <DndContext
      id={dndId}
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
