'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TasksView } from './tasks-view'
import { MilestonesView } from './milestones-view'
import { ChangeRequestsView } from './change-requests'
import { ProjectFinanceTab } from './tabs/finance'
import { AdminOverviewTab } from './tabs/overview'
import { AdminChatTab } from './tabs/chat'
import { AdminDocsTab, type ContractDoc } from './tabs/docs'
import { AdminUploadsTab, type UploadItem } from './tabs/uploads'
import { ProjectHeader } from './project-header'
import type { Milestone } from '@/lib/milestones/types'
import type { ChangeRequest } from '@/lib/change-requests/types'
import type { TaskStatus, TaskWithAssignee } from '@/lib/tasks/types'
import type { TaskFiltersState } from './filter-utils'

type TabValue = 'overview' | 'tasks' | 'milestones' | 'change-requests' | 'chat' | 'docs' | 'uploads' | 'finance'

interface Message {
  id: string
  project_id: string
  author_type: string
  author_id: string | null
  body: string
  created_at: string
}

interface Project {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  client_id?: string | null
  clients?: { name: string; email: string } | null
}

interface Props {
  project: Project
  projectId: string
  currentTab: TabValue
  currentView: 'list' | 'kanban'
  tasksByStatus: Record<TaskStatus, TaskWithAssignee[]>
  taskCounts: Record<string, number>
  totalTasks: number
  progress: number
  overdueCount: number
  filters: TaskFiltersState
  milestones: Milestone[]
  changeRequests: ChangeRequest[]
  clientId: string | null
  clientName: string | null
  clientUserName: string | null
  currentUserId: string
  initialMessages: Message[]
  initialDocs: ContractDoc[]
  initialUploads: UploadItem[]
}

export function ProjectTabs({
  project,
  projectId,
  currentTab,
  currentView,
  tasksByStatus,
  taskCounts,
  totalTasks,
  progress,
  overdueCount,
  filters,
  milestones,
  changeRequests,
  clientId,
  clientName,
  clientUserName,
  currentUserId,
  initialMessages,
  initialDocs,
  initialUploads,
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
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="change-requests">Change Requests</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="docs">Docs</TabsTrigger>
        <TabsTrigger value="uploads">Uploads</TabsTrigger>
        <TabsTrigger value="finance">Finance</TabsTrigger>
      </TabsList>

      <ProjectHeader
        project={project}
        taskCounts={taskCounts as Record<import('@/lib/tasks/types').TaskStatus, number>}
        totalTasks={totalTasks}
        progress={progress}
        overdueCount={overdueCount}
        currentView={currentView}
        currentTab={currentTab}
      />

      <TabsContent value="overview">
        <AdminOverviewTab
          project={project}
          taskCounts={taskCounts}
          totalTasks={totalTasks}
          progress={progress}
          milestonesCount={milestones.length}
          changeRequestsCount={changeRequests.length}
        />
      </TabsContent>

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

      <TabsContent value="chat">
        <AdminChatTab
          projectId={projectId}
          clientName={clientName ?? 'Client'}
          clientUserName={clientUserName}
          initialMessages={initialMessages}
        />
      </TabsContent>

      <TabsContent value="docs">
        <AdminDocsTab
          projectName={project.name}
          initialDocs={initialDocs}
        />
      </TabsContent>

      <TabsContent value="uploads">
        <AdminUploadsTab
          projectId={projectId}
          projectName={project.name}
          currentUserId={currentUserId}
          initialUploads={initialUploads}
        />
      </TabsContent>

      <TabsContent value="finance">
        <ProjectFinanceTab
          projectId={projectId}
          clientId={clientId}
          clientName={clientName}
        />
      </TabsContent>
    </Tabs>
  )
}
