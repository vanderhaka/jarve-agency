'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TasksView } from './tasks-view'
import { MilestonesView } from './milestones-view'
import { ChangeRequestsView } from './change-requests'
import type { Milestone } from '@/lib/milestones/types'
import type { ChangeRequest } from '@/lib/change-requests/types'
import type { TaskStatus, TaskWithAssignee } from '@/lib/tasks/types'
import type { TaskFiltersState } from './filter-utils'

interface Props {
  projectId: string
  currentTab: 'tasks' | 'milestones' | 'change-requests'
  currentView: 'list' | 'kanban'
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
  filters: TaskFiltersState
  milestones: Milestone[]
  changeRequests: ChangeRequest[]
}

export function ProjectTabs({
  projectId,
  currentTab,
  currentView,
  tasksByStatus,
  filters,
  milestones,
  changeRequests,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="change-requests">Change Requests</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TasksView
          projectId={projectId}
          tasksByStatus={tasksByStatus}
          currentView={currentView}
          filters={filters}
        />
      </TabsContent>

      <TabsContent value="milestones">
        <MilestonesView
          projectId={projectId}
          milestones={milestones}
        />
      </TabsContent>

      <TabsContent value="change-requests">
        <ChangeRequestsView
          projectId={projectId}
          changeRequests={changeRequests}
        />
      </TabsContent>
    </Tabs>
  )
}
