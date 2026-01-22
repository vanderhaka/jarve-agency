import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AuditFilters } from './audit-filters'
import { AuditPagination } from './audit-pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-500',
  email: 'bg-purple-500',
  meeting: 'bg-emerald-500',
  note: 'bg-muted text-foreground',
  default: 'bg-gray-500',
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? TYPE_COLORS.default
}

const ITEMS_PER_PAGE = 20

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee || employee.role !== 'admin') {
    redirect('/app')
  }

  // Parse filter params
  const typeFilter = typeof params.type === 'string' ? params.type : undefined
  const employeeFilter = typeof params.employee === 'string' ? params.employee : undefined
  const fromDate = typeof params.from === 'string' ? params.from : undefined
  const toDate = typeof params.to === 'string' ? params.to : undefined
  const currentPage = typeof params.page === 'string' ? parseInt(params.page, 10) : 1

  // Fetch employees for filter dropdown
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  // Build query with filters
  let query = supabase
    .from('interactions')
    .select(`
      id,
      type,
      summary,
      next_steps,
      created_at,
      created_by,
      created_by_name,
      lead_id,
      client_id,
      leads (name),
      clients (name)
    `, { count: 'exact' })
    .is('deleted_at', null)

  // Apply filters
  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('type', typeFilter)
  }
  if (employeeFilter && employeeFilter !== 'all') {
    query = query.eq('created_by', employeeFilter)
  }
  if (fromDate) {
    query = query.gte('created_at', new Date(fromDate).toISOString())
  }
  if (toDate) {
    const toDateTime = new Date(toDate)
    toDateTime.setHours(23, 59, 59, 999)
    query = query.lte('created_at', toDateTime.toISOString())
  }

  // Add pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data: interactions, error: interactionsError, count } = await query

  if (interactionsError) {
    console.error('[admin] interactions load error:', interactionsError)
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0
  const hasFilters = typeFilter || employeeFilter || fromDate || toDate

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Central log of all lead and client communications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Recent Interactions
            {count !== null && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {hasFilters ? `${count} filtered` : `${count} total`}
              </span>
            )}
          </CardTitle>
          {interactionsError && (
            <p className="text-sm text-destructive">Unable to load interactions right now.</p>
          )}
        </CardHeader>
        <CardContent>
          <AuditFilters employees={employees || []} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Lead / Client</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Next Steps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!interactions || interactions.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="No activity logged yet"
                      description="Interactions with leads and clients will appear here as your team logs calls, emails, and meetings."
                    />
                  </TableCell>
                </TableRow>
              ) : (
              interactions.map((interaction) => {
                const interactionType = interaction.type ?? 'default'
                return (
                <TableRow key={interaction.id}>
                  <TableCell>
                    <Badge className={getTypeColor(interactionType)}>
                      {interaction.type || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap">
                    {interaction.summary}
                  </TableCell>
                  <TableCell>
                    {(interaction.leads as unknown as { name: string } | null)?.name ||
                     (interaction.clients as unknown as { name: string } | null)?.name ||
                     (interaction.lead_id || interaction.client_id ?
                       <span className="text-muted-foreground italic">Deleted</span> : '-')}
                  </TableCell>
                  <TableCell>
                    {interaction.created_by_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {interaction.created_at
                      ? new Date(interaction.created_at).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interaction.next_steps || '-'}
                  </TableCell>
                </TableRow>
                )
              })
              )}
            </TableBody>
          </Table>

          <AuditPagination currentPage={currentPage} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  )
}
