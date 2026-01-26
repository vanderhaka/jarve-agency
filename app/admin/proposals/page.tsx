import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowRight, FileText, Settings, Plus } from 'lucide-react'

async function getProposals() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      title,
      status,
      current_version,
      created_at,
      updated_at,
      signed_at,
      client:clients(id, name),
      project:agency_projects(id, name),
      lead:leads(id, name)
    `)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proposals:', error)
    return []
  }

  // Transform data - Supabase joins return arrays, extract first element
  return (data || []).map(p => ({
    ...p,
    client: Array.isArray(p.client) ? p.client[0] : p.client,
    project: Array.isArray(p.project) ? p.project[0] : p.project,
    lead: Array.isArray(p.lead) ? p.lead[0] : p.lead,
  }))
}

async function getTemplates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return data || []
}

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [proposals, templates] = await Promise.all([
    getProposals(),
    getTemplates()
  ])

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    signed: 'bg-green-500',
    archived: 'bg-orange-500',
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proposals & Contracts</h1>
          <p className="text-muted-foreground">Create, send, and track proposals</p>
        </div>
        <Button asChild>
          <Link href="/admin/proposals/new">
            <Plus className="mr-2 h-4 w-4" /> New Proposal
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals" className="gap-2">
            <FileText className="h-4 w-4" /> Proposals
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Settings className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Client / Lead</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No proposals yet. Create your first proposal to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/proposals/${proposal.id}`}
                            className="hover:underline text-primary"
                          >
                            {proposal.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[proposal.status] || 'bg-gray-500'}>
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>v{proposal.current_version}</TableCell>
                        <TableCell>
                          {proposal.client?.name || proposal.lead?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {proposal.project?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/proposals/${proposal.id}`}>
                              View <ArrowRight className="ml-2 h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proposal Templates</CardTitle>
              <Button size="sm" asChild>
                <Link href="/admin/proposals/templates/new">
                  <Plus className="mr-2 h-4 w-4" /> New Template
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No templates yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/proposals/templates/${template.id}`}
                            className="hover:underline text-primary"
                          >
                            {template.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {Array.isArray(template.sections) ? template.sections.length : 0} sections
                        </TableCell>
                        <TableCell>
                          {template.is_default ? (
                            <Badge className="bg-primary">Default</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(template.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/proposals/templates/${template.id}`}>
                              Edit <ArrowRight className="ml-2 h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
