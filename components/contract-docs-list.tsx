'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Loader2, FileText, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ContractDoc {
  id: string
  doc_type: string
  title: string
  version: number | null
  file_path: string
  signed_at: string | null
  source_table: string | null
  source_id: string | null
  created_at: string
  client?: { id: string; name: string }
  project?: { id: string; name: string }
}

interface ContractDocsListProps {
  clientId?: string
  projectId?: string
  showClient?: boolean
  showProject?: boolean
}

export function ContractDocsList({
  clientId,
  projectId,
  showClient = false,
  showProject = false
}: ContractDocsListProps) {
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<ContractDoc[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchDocs() {
      let query = supabase
        .from('contract_docs')
        .select(`
          *,
          client:clients(id, name),
          project:agency_projects(id, name)
        `)
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching contract docs:', error)
      } else {
        setDocs(data || [])
      }

      setLoading(false)
    }

    fetchDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, projectId])

  const docTypeLabels: Record<string, string> = {
    msa: 'Master Service Agreement',
    sow: 'Statement of Work',
    proposal_version: 'Proposal',
    change_request: 'Change Request',
    invoice: 'Invoice'
  }

  const docTypeColors: Record<string, string> = {
    msa: 'bg-purple-500',
    sow: 'bg-blue-500',
    proposal_version: 'bg-green-500',
    change_request: 'bg-orange-500',
    invoice: 'bg-gray-500'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Contract Documents</CardTitle>
            <CardDescription>
              Signed agreements and legal documents
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No contract documents yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                {showClient && <TableHead>Client</TableHead>}
                {showProject && <TableHead>Project</TableHead>}
                <TableHead>Signed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    {doc.title}
                    {doc.version && (
                      <span className="text-muted-foreground ml-2">
                        v{doc.version}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={docTypeColors[doc.doc_type] || 'bg-gray-500'}>
                      {docTypeLabels[doc.doc_type] || doc.doc_type}
                    </Badge>
                  </TableCell>
                  {showClient && (
                    <TableCell>
                      {doc.client ? (
                        <Link
                          href={`/admin/clients/${doc.client.id}`}
                          className="hover:underline text-primary"
                        >
                          {doc.client.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  )}
                  {showProject && (
                    <TableCell>
                      {doc.project ? (
                        <Link
                          href={`/admin/projects/${doc.project.id}`}
                          className="hover:underline text-primary"
                        >
                          {doc.project.name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {doc.signed_at ? (
                      new Date(doc.signed_at).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.source_table === 'proposals' && doc.source_id && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/proposals/${doc.source_id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {doc.file_path && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
