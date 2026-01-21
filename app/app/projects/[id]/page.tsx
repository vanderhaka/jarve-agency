import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTasksByProjectGrouped, getTaskCounts, getOverdueCount } from '@/lib/tasks/data'
import { ProjectHeader } from './project-header'
import { TasksView } from './tasks-view'
import { parseFiltersFromParams } from './filter-utils'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    view?: 'list' | 'kanban'
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
  const { view = 'kanban' } = resolvedSearchParams

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

  const [tasksByStatus, taskCounts, overdueCount] = await Promise.all([
    getTasksByProjectGrouped(id),
    getTaskCounts(id),
    getOverdueCount(id),
  ])

  const totalTasks = Object.values(taskCounts).reduce((sum, count) => sum + count, 0)
  const doneTasks = taskCounts['Done']
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectHeader
        project={project}
        taskCounts={taskCounts}
        totalTasks={totalTasks}
        progress={progress}
        overdueCount={overdueCount}
        currentView={view}
      />
      <TasksView
        projectId={id}
        tasksByStatus={tasksByStatus}
        currentView={view}
        filters={filters}
      />
    </div>
  )
}
