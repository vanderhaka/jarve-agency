import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, Mail, DollarSign, ClipboardList } from 'lucide-react'
import { QuickActionsGrid } from '@/components/admin/quick-actions-grid'

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

  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

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
