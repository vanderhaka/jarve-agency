'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Download, Check, Clock, Loader2 } from 'lucide-react'
import { usePortal } from './portal-context'
import { getContractDocSignedUrl, getContractDocs } from '@/lib/integrations/portal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Doc {
  id: string
  title: string
  doc_type: string
  file_path: string | null
  created_at: string
  signed_at: string | null
}

interface DocsVaultProps {
  initialDocs: Doc[]
  initialProjectId: string | null
}

const docTypeLabels: Record<string, string> = {
  msa: 'Master Service Agreement',
  sow: 'Statement of Work',
  proposal: 'Proposal',
  contract: 'Contract',
  invoice: 'Invoice',
  signed: 'Signed Document',
}

export function DocsVault({ initialDocs, initialProjectId }: DocsVaultProps) {
  const { token, selectedProject } = usePortal()
  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const currentProjectIdRef = useRef<string | null>(initialProjectId)

  // Fetch docs when project changes
  useEffect(() => {
    if (!selectedProject) return
    
    const projectId = selectedProject.id
    
    // Skip if this is the initial project (data already loaded from server)
    if (projectId === currentProjectIdRef.current) return
    
    // Update ref immediately to track which project we're fetching for
    currentProjectIdRef.current = projectId
    
    async function fetchDocs() {
      setLoading(true)
      try {
        const result = await getContractDocs(token, projectId)
        // Check if this is still the current project before updating state
        if (currentProjectIdRef.current !== projectId) return
        if (result.success) {
          setDocs(result.docs)
        } else {
          toast.error(result.error || 'Failed to load documents')
        }
      } catch (error) {
        // Check if this is still the current project before showing error
        if (currentProjectIdRef.current !== projectId) return
        toast.error('Failed to load documents')
      } finally {
        // Only update loading state if this is still the current project
        if (currentProjectIdRef.current === projectId) {
          setLoading(false)
        }
      }
    }
    
    fetchDocs()
  }, [token, selectedProject])

  async function handleDownload(docId: string, docName: string) {
    setDownloading(docId)
    try {
      const result = await getContractDocSignedUrl(token, docId)

      if (result.success) {
        // Open the signed URL in a new tab
        window.open(result.url, '_blank')
      } else {
        toast.error(result.error || 'Failed to get download link')
      }
    } catch (error) {
      toast.error('Failed to download document')
    } finally {
      setDownloading(null)
    }
  }

  if (!selectedProject) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No project selected</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Contracts, proposals, and invoices for {selectedProject.name}
        </p>
      </div>

      {/* Documents list */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading documents...</p>
        </Card>
      ) : docs.length === 0 ? (
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
                        {docTypeLabels[doc.doc_type] || doc.doc_type}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.title)}
                    disabled={downloading === doc.id || !doc.file_path}
                  >
                    {!doc.file_path ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        PDF Pending
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === doc.id ? 'Loading...' : 'Download'}
                      </>
                    )}
                  </Button>
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
            If you need a new link, simply click the download button again.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
