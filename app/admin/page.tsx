import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, UserCheck } from 'lucide-react'

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
  const [employeesResult, adminsResult, interactionsResult] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('role', 'admin').is('deleted_at', null),
    supabase.from('interactions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const hasStatsError = Boolean(
    employeesResult.error || adminsResult.error || interactionsResult.error
  )

  if (employeesResult.error) console.error('[admin] employees count error:', employeesResult.error)
  if (adminsResult.error) console.error('[admin] admins count error:', adminsResult.error)
  if (interactionsResult.error) console.error('[admin] interactions count error:', interactionsResult.error)

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeesResult.count || 0}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminsResult.count || 0}</div>
            <p className="text-xs text-muted-foreground">With admin access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactionsResult.count || 0}</div>
            <p className="text-xs text-muted-foreground">Logged activities</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
