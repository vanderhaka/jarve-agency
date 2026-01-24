import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTasksByProjectGrouped, getTaskCounts, getOverdueCount } from '@/lib/tasks/data'
import { getMilestonesByProject } from '@/lib/milestones/data'
import { getChangeRequestsByProject } from '@/lib/change-requests/data'
import { ProjectHeader } from './project-header'
import { TasksView } from './tasks-view'
import { ProjectTabs } from './project-tabs'
import { parseFiltersFromParams } from './filter-utils'
import { Breadcrumbs } from '@/components/navigation/breadcrumbs'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    view?: 'list' | 'kanban'
    tab?: 'tasks' | 'milestones' | 'change-requests'
    search?: string
    status?: string
    type?: string
    priority?: string
  }>
}

async function getProject(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agency_projects')
    .select(`
      *,
      clients (
        name,
        email
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching project:', error)
    return null
  }

  return data
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const { view = 'kanban', tab = 'tasks' } = resolvedSearchParams

  // Parse filters from URL search params
  const filters = parseFiltersFromParams(new URLSearchParams(
    Object.entries(resolvedSearchParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const project = await getProject(id)
  if (!project) {
    notFound()
  }

  const [tasksByStatus, taskCounts, overdueCount, milestones, changeRequests] = await Promise.all([
    getTasksByProjectGrouped(id),
    getTaskCounts(id),
    getOverdueCount(id),
    getMilestonesByProject(id),
    getChangeRequestsByProject(id),
  ])

  const totalTasks = Object.values(taskCounts).reduce((sum, count) => sum + count, 0)
  const doneTasks = taskCounts['Done']
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumbs />
      <ProjectHeader
        project={project}
        taskCounts={taskCounts}
        totalTasks={totalTasks}
        progress={progress}
        overdueCount={overdueCount}
        currentView={view}
      />
      <ProjectTabs
        projectId={id}
        currentTab={tab}
        currentView={view}
        tasksByStatus={tasksByStatus}
        filters={filters}
        milestones={milestones}
        changeRequests={changeRequests}
      />
    </div>
  )
}
