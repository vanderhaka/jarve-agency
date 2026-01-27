'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithAssignee } from '@/lib/tasks/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

// Helper for initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Higher contrast badge colors
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

interface SortableTaskCardProps {
  task: TaskWithAssignee
  onClick?: () => void
}

export function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
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
  const hasFooter = task.due_date || priorityInfo.symbol || showType

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
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm line-clamp-2 text-gray-900 flex-1">{task.title}</p>
            {task.assignee && (
              <div
                className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium ring-2 ring-zinc-900 flex-shrink-0"
                title={task.assignee.name}
              >
                {getInitials(task.assignee.name)}
              </div>
            )}
          </div>
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
              {priorityInfo.symbol && (
                <span className={`text-sm font-bold ${priorityInfo.color}`}>
                  {priorityInfo.symbol}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface TaskCardOverlayProps {
  task: TaskWithAssignee
}

export function TaskCardOverlay({ task }: TaskCardOverlayProps) {
  const showType = task.type !== 'feature'
  const priorityInfo = priorityIndicators[task.priority]
  const hasFooter = task.due_date || priorityInfo.symbol || showType

  return (
    <Card className="cursor-grabbing shadow-xl rotate-2 bg-white border border-gray-300">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm line-clamp-2 text-gray-900 flex-1">{task.title}</p>
            {task.assignee && (
              <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium ring-2 ring-zinc-900 flex-shrink-0">
                {getInitials(task.assignee.name)}
              </div>
            )}
          </div>
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
              {priorityInfo.symbol && (
                <span className={`text-sm font-bold ${priorityInfo.color}`}>
                  {priorityInfo.symbol}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
