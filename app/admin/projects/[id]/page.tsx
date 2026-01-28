import { createClient } from '@/utils/supabase/server'
import { createPortalServiceClient } from '@/utils/supabase/portal-service'
import { redirect, notFound } from 'next/navigation'
import { getTasksByProjectGrouped, getTaskCounts, getOverdueCount } from '@/lib/tasks/data'
import { getMilestonesByProject } from '@/lib/milestones/data'
import { getChangeRequestsByProject } from '@/lib/change-requests/data'
import { parseFiltersFromParams } from './filter-utils'
import { Breadcrumbs } from '@/components/navigation/breadcrumbs'
import { ProjectTabs } from './project-tabs'
import { getProjectDocs } from './tabs/docs/actions'
import { getProjectUploads } from './tabs/uploads/actions'

type TabValue = 'overview' | 'tasks' | 'milestones' | 'change-requests' | 'chat' | 'docs' | 'uploads' | 'finance'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    view?: 'list' | 'kanban'
    tab?: TabValue
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
        id,
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

async function getProjectMessages(projectId: string) {
  // Use service role client (RLS enabled but no policies exist for portal_messages)
  const supabase = createPortalServiceClient()
  const { data, error } = await supabase
    .from('portal_messages')
    .select('id, project_id, author_type, author_id, body, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data ?? []
}

async function getClientUserName(clientId: string | null) {
  if (!clientId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('client_users')
    .select('name')
    .eq('client_id', clientId)
    .limit(1)
    .single()

  return data?.name ?? null
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const { view = 'kanban', tab = 'overview' } = resolvedSearchParams

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

  // Fetch all data in parallel
  const [
    tasksByStatus,
    taskCounts,
    overdueCount,
    milestones,
    changeRequests,
    messages,
    docsResult,
    uploadsResult,
    clientUserName,
  ] = await Promise.all([
    getTasksByProjectGrouped(id),
    getTaskCounts(id),
    getOverdueCount(id),
    getMilestonesByProject(id),
    getChangeRequestsByProject(id),
    getProjectMessages(id),
    getProjectDocs(id),
    getProjectUploads(id),
    getClientUserName(project.client_id),
  ])

  const totalTasks = Object.values(taskCounts).reduce((sum, count) => sum + count, 0)
  const doneTasks = taskCounts['Done']
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumbs />
      <ProjectTabs
        project={project}
        projectId={id}
        currentTab={tab}
        currentView={view}
        tasksByStatus={tasksByStatus}
        taskCounts={taskCounts}
        totalTasks={totalTasks}
        progress={progress}
        overdueCount={overdueCount}
        filters={filters}
        milestones={milestones}
        changeRequests={changeRequests}
        clientId={project.client_id ?? null}
        clientName={project.clients?.name ?? null}
        clientUserName={clientUserName}
        currentUserId={user.id}
        initialMessages={messages}
        initialDocs={docsResult.docs}
        initialUploads={uploadsResult.uploads}
      />
    </div>
  )
}
