import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, DollarSign, UserCircle } from 'lucide-react'
import { TaskDialog } from '@/components/task-dialog'
import { InteractionTimeline } from '@/components/interaction-timeline'

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  converted: 'bg-green-500',
  closed: 'bg-gray-500',
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      *,
      employees (
        name,
        email
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !lead) {
    redirect('/app/leads')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <Badge className={statusColors[lead.status] || 'bg-gray-500'}>{lead.status}</Badge>
          </div>
          <p className="text-muted-foreground">Lead overview and audit trail</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/app/leads">Back to leads</Link>
          </Button>
          <TaskDialog leadId={lead.id} triggerLabel="Lead Tasks" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="hover:underline">
                {lead.email}
              </a>
            </div>
            {lead.amount ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Pipeline value: ${lead.amount.toLocaleString()}</span>
              </div>
            ) : null}
            {lead.source && (
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span>Source: {lead.source}</span>
              </div>
            )}
            {lead.employees && (
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span>Owner: {lead.employees.name}</span>
              </div>
            )}
            <div className="text-muted-foreground text-sm">
              Created {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {lead.message || 'No notes recorded yet.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <InteractionTimeline leadId={lead.id} />
    </div>
  )
}
