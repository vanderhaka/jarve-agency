import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

const DEFAULT_STATUS_COLOR = 'bg-gray-100 text-gray-700'

const statusColors: Record<string, string> = {
  'Backlog': DEFAULT_STATUS_COLOR,
  'Ready': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Review': 'bg-purple-100 text-purple-700',
  'QA': 'bg-orange-100 text-orange-700',
  'Done': 'bg-emerald-100 text-emerald-700',
  'Blocked': 'bg-red-100 text-red-700',
}

function getStatusColor(status: string): string {
  return statusColors[status] ?? DEFAULT_STATUS_COLOR
}

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`*, agency_projects ( id, name )`)
    .eq('assignee_id', user.id)
    .neq('status', 'Done')
    .order('due_date', { ascending: true, nullsFirst: true })

  if (error) {
    console.error('Error fetching tasks:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            Tasks assigned to you across leads and projects
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {(tasks || []).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              You&apos;re all caught up. No open tasks assigned to you.
            </CardContent>
          </Card>
        ) : (
          tasks!.map((task) => (
            <Card key={task.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>
                    {task.agency_projects ? (
                      <Link href={`/app/projects/${task.agency_projects.id}`} className="text-primary hover:underline">
                        {task.agency_projects.name}
                      </Link>
                    ) : (
                      'General task'
                    )}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                )}
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                  {task.due_date && <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>}
                  <span className="capitalize">Priority: {task.priority}</span>
                  <span className="capitalize">Type: {task.type}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
