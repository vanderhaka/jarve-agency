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
import { UserCircle, LayoutList, Kanban } from 'lucide-react'
import { LeadsKanban } from '@/components/leads-kanban'
import { TaskDialog } from '@/components/task-dialog'
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
  employees?: {
    name: string
  }
  message?: string
}

export default function LeadsPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase
        .from('leads')
        .select(`
          *,
          employees (
            name
          )
        `)
        .order('created_at', { ascending: false })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) setLeads(data as any) // Type assertion for joined data
      setLoading(false)
    }
    fetchLeads()
  }, [])

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    converted: 'bg-green-500',
    closed: 'bg-gray-500',
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
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      <TableCell>${lead.amount?.toLocaleString() || '0.00'}</TableCell>
                      <TableCell>
                        {lead.source ? (
                          <Badge variant="outline">{lead.source}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.employees ? (
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.employees.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[lead.status] || 'bg-gray-500'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <TaskDialog leadId={lead.id} triggerLabel="Tasks" />
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
