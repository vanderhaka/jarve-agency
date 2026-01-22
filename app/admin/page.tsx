import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, UserCheck, UserPlus, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (employee?.role !== 'admin') {
    redirect('/app')
  }

  // Count only active (non-deleted) records
  const [employeesResult, adminsResult, interactionsResult, recentInteractions] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('role', 'admin').is('deleted_at', null),
    supabase.from('interactions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('interactions')
      .select(`
        id,
        type,
        summary,
        created_at,
        created_by_name,
        lead_id,
        client_id,
        leads (name),
        clients (name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const hasStatsError = Boolean(
    employeesResult.error || adminsResult.error || interactionsResult.error || recentInteractions.error
  )

  if (employeesResult.error) console.error('[admin] employees count error:', employeesResult.error)
  if (adminsResult.error) console.error('[admin] admins count error:', adminsResult.error)
  if (interactionsResult.error) console.error('[admin] interactions count error:', interactionsResult.error)
  if (recentInteractions.error) console.error('[admin] recent interactions error:', recentInteractions.error)

  const typeIcons = {
    call: '📞',
    email: '📧',
    meeting: '🤝',
    note: '📝',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Team overview and activity</p>
        {hasStatsError && (
          <p className="text-sm text-destructive">Some stats failed to load. Please refresh.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/employees">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeesResult.count || 0}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/employees">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminsResult.count || 0}</div>
              <p className="text-xs text-muted-foreground">With admin access</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/audit">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interactionsResult.count || 0}</div>
              <p className="text-xs text-muted-foreground">Logged activities</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/employees#invite-form">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Invite Team Member</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Send an invite email</p>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/audit">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">View Activity Log</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">All team interactions</p>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/employees">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Manage Roles</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Update team permissions</p>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href="/admin/audit"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInteractions.data && recentInteractions.data.length > 0 ? (
            <div className="space-y-4">
              {recentInteractions.data.map((interaction) => {
                const DELETED_ENTITY_LABEL = 'Deleted entity'
                const leadName = (interaction.leads as unknown as { name: string } | null)?.name
                const clientName = (interaction.clients as unknown as { name: string } | null)?.name
                const entityName = leadName || clientName || DELETED_ENTITY_LABEL
                const entityLink = interaction.lead_id
                  ? `/app/leads/${interaction.lead_id}`
                  : interaction.client_id
                  ? `/app/clients/${interaction.client_id}`
                  : null

                return (
                  <div key={interaction.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="text-2xl">{typeIcons[interaction.type as keyof typeof typeIcons] || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{interaction.summary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {entityLink ? (
                          <Link
                            href={entityLink}
                            className="text-xs text-primary hover:underline"
                          >
                            {entityName}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">{entityName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{interaction.created_by_name || 'Unknown'}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {interaction.created_at ? formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true }) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
