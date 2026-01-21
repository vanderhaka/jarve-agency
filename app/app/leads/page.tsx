'use client'

import { createClient } from '@/utils/supabase/client'
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
import { LeadStatusSelect } from '@/components/lead-status-select'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { LayoutList, Kanban } from 'lucide-react'
import { LeadsKanban } from '@/components/leads-kanban'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type Lead = {
  id: string
  name: string
  email: string
  amount: number
  status: string
  source: string
  created_at: string
  message?: string
  company?: string
  project_type?: string
  budget?: string
  timeline?: string
}

export default function LeadsPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchLeads() {
      console.log('[Leads] Fetching leads...')
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('[Leads] Response:', { data, error })

      if (error) {
        console.error('[Leads] Error:', error)
      }

      if (data) setLeads(data)
      setLoading(false)
    }
    fetchLeads()
  }, [])

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your leads</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-3"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
              className="h-8 px-3"
            >
              <Kanban className="h-4 w-4 mr-2" />
              Board
            </Button>
          </div>
          <NewLeadDialog />
        </div>
      </div>

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      {loading ? 'Loading...' : 'No leads yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="text-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company || '-'}</TableCell>
                      <TableCell>
                        {lead.project_type ? (
                          <Badge variant="outline">{lead.project_type.replace(/_/g, ' ')}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.budget ? (
                          <Badge variant="secondary">{lead.budget.replace(/_/g, ' ')}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.timeline ? (
                          <Badge variant="outline">{lead.timeline.replace(/_/g, ' ')}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <LeadsKanban initialLeads={leads} />
      )}
    </div>
  )
}
