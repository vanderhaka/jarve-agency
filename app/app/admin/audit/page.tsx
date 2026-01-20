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

const typeColors: Record<string, string> = {
  call: 'bg-blue-500',
  email: 'bg-purple-500',
  meeting: 'bg-emerald-500',
  note: 'bg-muted text-foreground',
}

export default async function AuditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!employee || employee.role !== 'admin') {
    redirect('/app')
  }

  const { data: interactions } = await supabase
    .from('interactions')
    .select(`
      *,
      leads (name),
      clients (name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audit Trails</h1>
        <p className="text-muted-foreground">
          Central log of all lead and client communications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Interactions</CardTitle>
        </CardHeader>
        <CardContent>
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
              {(!interactions || interactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No interactions logged yet.
                  </TableCell>
                </TableRow>
              )}
              {interactions?.map((interaction) => (
                <TableRow key={interaction.id}>
                  <TableCell>
                    <Badge className={typeColors[interaction.type] || 'bg-gray-500'}>
                      {interaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap">
                    {interaction.summary}
                  </TableCell>
                  <TableCell>
                    {interaction.leads?.name || interaction.clients?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {interaction.created_by_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {new Date(interaction.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interaction.next_steps || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
