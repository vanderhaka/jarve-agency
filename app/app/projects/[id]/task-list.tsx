'use client'

import { Task } from '@/lib/tasks/types'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  'Backlog': 'bg-gray-100 text-gray-700',
  'Ready': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Review': 'bg-purple-100 text-purple-700',
  'QA': 'bg-orange-100 text-orange-700',
  'Done': 'bg-green-100 text-green-700',
  'Blocked': 'bg-red-100 text-red-700',
}

const typeColors: Record<string, string> = {
  feature: 'bg-green-100 text-green-700',
  bug: 'bg-red-100 text-red-700',
  chore: 'bg-gray-100 text-gray-700',
  spike: 'bg-purple-100 text-purple-700',
}

export function TaskList({ tasks, onTaskClick }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
        No tasks yet. Create your first task to get started.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onTaskClick?.(task)}
            >
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge className={statusColors[task.status]}>{task.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={typeColors[task.type]}>{task.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={priorityColors[task.priority]}>{task.priority}</Badge>
              </TableCell>
              <TableCell>
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
