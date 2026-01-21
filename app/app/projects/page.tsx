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
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ProjectClient {
  id: string
  name: string
  email: string
}

interface ProjectWithClient {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  created_at: string
  client_id: string | null
  clients: ProjectClient[] | ProjectClient | null
}

interface Client {
  id: string
  name: string
  email: string
}

type ProjectsResult =
  | { success: true; data: ProjectWithClient[] }
  | { success: false; error: string }

type ClientsResult =
  | { success: true; data: Client[] }
  | { success: false; error: string }

async function fetchProjects(): Promise<ProjectWithClient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agency_projects')
    .select(`
      id,
      name,
      type,
      status,
      description,
      created_at,
      client_id,
      clients (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as ProjectWithClient[]) || []
}

async function fetchClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Client[]) || []
}

async function getProjects(): Promise<ProjectsResult> {
  try {
    const data = await fetchProjects()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to load projects' }
  }
}

async function getClients(): Promise<ClientsResult> {
  try {
    const data = await fetchClients()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return { success: false, error: 'Failed to load clients' }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  maintenance: 'bg-yellow-500',
  default: 'bg-gray-500',
}

const typeColors: Record<string, string> = {
  web: 'bg-purple-500',
  ios: 'bg-pink-500',
  mvp: 'bg-orange-500',
  integration: 'bg-cyan-500',
  default: 'bg-gray-500',
}

function getStatusColor(status: string): string {
  return statusColors[status] ?? statusColors.default
}

function getTypeColor(type: string): string {
  return typeColors[type] ?? typeColors.default
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch in parallel
  const [projectsResult, clientsResult] = await Promise.all([
    getProjects(),
    getClients(),
  ])

  const hasError = !projectsResult.success || !clientsResult.success
  const projects = projectsResult.success ? projectsResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []

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
          {hasError ? (
            <div className="flex items-center justify-center gap-2 py-8 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                {!projectsResult.success && projectsResult.error}
                {!projectsResult.success && !clientsResult.success && ' • '}
                {!clientsResult.success && clientsResult.error}
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
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
                        <Badge className={getTypeColor(project.type)}>
                          {capitalize(project.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {capitalize(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const client = Array.isArray(project.clients)
                            ? project.clients[0]
                            : project.clients
                          return client ? (
                            <Link
                              href={`/app/clients/${project.client_id}`}
                              className="text-primary hover:underline"
                            >
                              {client.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">No client</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {project.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate cursor-help">
                                  {project.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-sm">
                                <p>{project.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(project.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
