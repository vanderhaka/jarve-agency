import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Mail, Phone, Globe, MapPin, Calendar, Building } from 'lucide-react'
import Link from 'next/link'
import { InteractionTimeline } from '@/components/interaction-timeline'

async function getClient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      agency_projects (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data
}

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) {
    redirect('/app/clients')
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    lead: 'bg-blue-500',
    inactive: 'bg-gray-500',
    churned: 'bg-red-500',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {client.name}
            <Badge className={statusColors[client.status] || 'bg-gray-500'}>
              {client.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {client.company && (
              <>
                <Building className="h-3 w-3" /> {client.company}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline">{client.website}</a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{client.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Client since {new Date(client.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {client.notes || 'No notes added.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Projects associated with this client</CardDescription>
                </CardHeader>
                <CardContent>
                  {client.agency_projects && client.agency_projects.length > 0 ? (
                    <div className="space-y-4">
                      {client.agency_projects.map((project: { id: string; name: string; type: string; status: string }) => (
                        <div key={project.id} className="flex items-center justify-between border p-4 rounded-lg">
                          <div>
                            <h3 className="font-semibold">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.type}</p>
                          </div>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No projects found.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <InteractionTimeline clientId={client.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Building className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

