'use client'

import { Task, TaskStatus, TASK_STATUSES } from '@/lib/tasks/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  projectId: string
  tasksByStatus: Record<TaskStatus, Task[]>
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

function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  return (
    <div className={`flex flex-col rounded-lg border-2 ${statusColors[status]} min-w-[280px] max-w-[280px]`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {status}
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2 space-y-2 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-md">
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </CardContent>
    </div>
  )
}

export function TaskKanban({ projectId, tasksByStatus }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
        />
      ))}
    </div>
  )
}
