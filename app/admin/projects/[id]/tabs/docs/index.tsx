'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Check, Clock } from 'lucide-react'
import { getDocSignedUrl, type ContractDoc } from './actions'
export type { ContractDoc }
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface AdminDocsTabProps {
  projectName: string
  initialDocs: ContractDoc[]
}

const docTypeLabels: Record<string, string> = {
  msa: 'Master Service Agreement',
  sow: 'Statement of Work',
  proposal: 'Proposal',
  contract: 'Contract',
  invoice: 'Invoice',
  signed: 'Signed Document',
}

export function AdminDocsTab({ projectName, initialDocs }: AdminDocsTabProps) {
  const [docs] = useState<ContractDoc[]>(initialDocs)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  async function handleView(docId: string) {
    setLoadingDoc(docId)
    try {
      const result = await getDocSignedUrl(docId)

      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Network error opening document')
    } finally {
      setLoadingDoc(null)
    }
  }

  async function handleDownload(docId: string, docTitle: string) {
    setLoadingDoc(docId)
    try {
      const result = await getDocSignedUrl(docId)

      if (result.success && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = `${docTitle}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Network error downloading document')
    } finally {
      setLoadingDoc(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Documents</h2>
        <p className="text-muted-foreground">
          Contracts, proposals, and invoices for {projectName}
        </p>
      </div>

      {/* Documents list */}
      {docs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Documents will appear here once they are created
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <CardDescription>
                        {docTypeLabels[doc.doc_type] ?? doc.doc_type}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.signed_at ? (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Signed
                      </Badge>
                    ) : doc.doc_type === 'proposal' || doc.doc_type === 'contract' || doc.doc_type === 'sow' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(doc.created_at).toLocaleDateString()}
                    {doc.signed_at && (
                      <> &bull; Signed {new Date(doc.signed_at).toLocaleDateString()}</>
                    )}
                  </p>
                  {!doc.file_path ? (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      PDF Pending
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc.id)}
                        disabled={loadingDoc === doc.id}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {loadingDoc === doc.id ? 'Loading...' : 'View'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.title)}
                        disabled={loadingDoc === doc.id}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            All documents are stored securely. Download links are valid for 1 hour.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
