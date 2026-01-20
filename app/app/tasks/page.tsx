import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  todo: 'bg-muted text-foreground',
  in_progress: 'bg-blue-500 text-white',
  done: 'bg-green-500 text-white',
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
    .select(`*, leads ( id, name ), agency_projects ( id, name )`)
    .or('status.eq.todo,status.eq.in_progress')
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
                    {task.leads ? (
                      <Link href={`/app/leads/${task.leads.id}`} className="text-primary hover:underline">
                        Lead: {task.leads.name}
                      </Link>
                    ) : task.agency_projects ? (
                      <span className="text-primary">Project: {task.agency_projects.name}</span>
                    ) : (
                      'General task'
                    )}
                  </CardDescription>
                </div>
                <Badge className={statusColors[task.status] || 'bg-gray-500 text-white'}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                )}
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                  {task.due_date && <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>}
                  <span className="capitalize">Priority: {task.priority}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
