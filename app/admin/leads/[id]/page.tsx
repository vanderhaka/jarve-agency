import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, DollarSign, UserCircle, Archive, CheckCircle2 } from 'lucide-react'
import { InteractionTimeline } from '@/components/interaction-timeline'
import { Breadcrumbs } from '@/components/navigation/breadcrumbs'
import { ConvertLeadDialog } from '@/components/convert-lead-dialog'

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  converted: 'bg-green-500',
  closed: 'bg-gray-500',
  default: 'bg-gray-500',
}

function getStatusColor(status: string): string {
  return statusColors[status] ?? statusColors.default
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !lead) {
    redirect('/admin/leads')
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
            {lead.archived_at && (
              <Badge variant="outline" className="gap-1">
                <Archive className="h-3 w-3" />
                Archived
              </Badge>
            )}
            {lead.converted_at && (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Converted
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Lead overview and audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          {!lead.converted_at && (
            <ConvertLeadDialog lead={lead} />
          )}
          <Button variant="outline" asChild>
            <Link href="/admin/leads">Back to leads</Link>
          </Button>
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
            {lead.converted_at && (
              <div className="pt-3 mt-3 border-t space-y-2">
                <p className="font-medium text-xs uppercase text-muted-foreground">Conversion Info</p>
                <div className="text-muted-foreground">
                  Converted {new Date(lead.converted_at).toLocaleDateString()}
                </div>
                {lead.client_id && (
                  <Link
                    href={`/admin/clients/${lead.client_id}`}
                    className="text-primary hover:underline block"
                  >
                    View Client
                  </Link>
                )}
                {lead.project_id && (
                  <Link
                    href={`/admin/projects/${lead.project_id}`}
                    className="text-primary hover:underline block"
                  >
                    View Project
                  </Link>
                )}
              </div>
            )}
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
