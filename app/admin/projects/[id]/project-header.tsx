'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LayoutGrid, List } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TaskStatus } from '@/lib/tasks/types'
import { NewTaskDialog } from './new-task-dialog'

type TabValue = 'overview' | 'tasks' | 'milestones' | 'change-requests' | 'chat' | 'docs' | 'uploads' | 'finance'

interface Props {
  project: { id: string }
  taskCounts: Record<TaskStatus, number>
  totalTasks: number
  progress: number
  overdueCount: number
  currentView: 'list' | 'kanban'
  currentTab?: TabValue
}

export function ProjectHeader({ project, taskCounts, totalTasks, progress, overdueCount, currentView, currentTab = 'overview' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setView = (view: 'list' | 'kanban') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-end">
        {/* Only show view toggle and new task button on Tasks tab */}
        {currentTab === 'tasks' && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('kanban')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant={currentView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
            <NewTaskDialog projectId={project.id} />
          </div>
        )}
      </div>

      {/* Summary Stats - Only show on Tasks tab */}
      {currentTab === 'tasks' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{taskCounts['In Progress']}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{taskCounts['Blocked']}</div>
              <div className="text-sm text-muted-foreground">Blocked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>
                {overdueCount}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{taskCounts['Done']}</div>
              <div className="text-sm text-muted-foreground">Done</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{progress}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
