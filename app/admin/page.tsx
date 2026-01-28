import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, Mail, DollarSign, ClipboardList } from 'lucide-react'
import { QuickActionsGrid } from '@/components/admin/quick-actions-grid'
import { CreateNewTabs } from '@/components/admin/create-new-tabs'
import { NewMessagesSection } from '@/components/admin/new-messages-section'

async function getUnreadMessages() {
  const supabase = createAdminClient()

  const { data: messages } = await supabase
    .from('portal_messages')
    .select(`
      project_id,
      created_at,
      agency_projects!inner(name)
    `)
    .eq('author_type', 'client')
    .order('created_at', { ascending: false })

  if (!messages || messages.length === 0) return []

  const projectIds = [...new Set(messages.map(m => m.project_id))]
  const { data: readStates } = await supabase
    .from('portal_read_state')
    .select('project_id, last_read_at')
    .eq('user_type', 'owner')
    .in('project_id', projectIds)

  const readMap = new Map(
    (readStates || []).map(rs => [rs.project_id, rs.last_read_at])
  )

  const projectMap = new Map<string, { projectName: string; unreadCount: number; latestMessageAt: string }>()

  for (const msg of messages) {
    const lastRead = readMap.get(msg.project_id)
    if (lastRead && new Date(msg.created_at) <= new Date(lastRead)) continue

    const existing = projectMap.get(msg.project_id)
    if (existing) {
      existing.unreadCount++
    } else {
      const project = msg.agency_projects as unknown as { name: string }
      projectMap.set(msg.project_id, {
        projectName: project.name,
        unreadCount: 1,
        latestMessageAt: msg.created_at,
      })
    }
  }

  return Array.from(projectMap.entries()).map(([projectId, data]) => ({
    projectId,
    ...data,
  }))
}

async function getStats() {
  const supabase = await createClient()

  const [leadsResult, projectsResult, clientsResult, tasksResult, pendingProposalsResult, overdueTasksResult] = await Promise.all([
    supabase.from('leads').select('id, amount', { count: 'exact' }),
    supabase.from('agency_projects').select('id', { count: 'exact', head: true }),
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done'),
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('due_date', new Date().toISOString().split('T')[0]),
  ])

  const newLeadsResult = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')

  // Calculate pipeline value
  const pipelineValue = leadsResult.data?.reduce((sum, lead) => sum + (lead.amount || 0), 0) || 0

  return {
    totalLeads: leadsResult.count || 0,
    newLeads: newLeadsResult.count || 0,
    totalProjects: projectsResult.count || 0,
    totalClients: clientsResult.count || 0,
    pipelineValue,
    openTasks: tasksResult.count || 0,
    pendingProposals: pendingProposalsResult.count || 0,
    overdueTasksCount: overdueTasksResult.count || 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [stats, unreadMessages] = await Promise.all([getStats(), getUnreadMessages()])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      <CreateNewTabs />

      <NewMessagesSection projects={unreadMessages} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pipelineValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Potential revenue from leads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in todo or progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalLeads} total leads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active relationships
            </p>
          </CardContent>
        </Card>
      </div>

      <QuickActionsGrid
        stats={{
          newLeads: stats.newLeads,
          openTasks: stats.openTasks,
          pendingProposals: stats.pendingProposals,
          overdueTasksCount: stats.overdueTasksCount,
        }}
      />
    </div>
  )
}
