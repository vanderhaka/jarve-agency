import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NewProjectDialog } from '@/components/new-project-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

async function getProjects() {
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data || []
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const projects = await getProjects()
  const clients = await getClients()

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500',
    active: 'bg-green-500',
    completed: 'bg-gray-500',
    maintenance: 'bg-yellow-500',
  }

  const typeColors: Record<string, string> = {
    web: 'bg-purple-500',
    ios: 'bg-pink-500',
    mvp: 'bg-orange-500',
    integration: 'bg-cyan-500',
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Track and manage all your projects</p>
        </div>
        <NewProjectDialog clients={clients} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No projects yet
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                        <Link
                          href={`/app/projects/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                    <TableCell>
                      <Badge className={typeColors[project.type] || 'bg-gray-500'}>
                        {project.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status] || 'bg-gray-500'}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.clients && typeof project.clients === 'object' && !Array.isArray(project.clients) ? (
                        <Link href={`/app/clients`} className="text-primary hover:underline">
                          {project.clients.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">No client</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{project.description || '-'}</TableCell>
                    <TableCell>
                      {new Date(project.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/projects/${project.id}`}>
                            View Tasks
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
