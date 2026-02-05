'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  updateProposal,
  sendProposal,
  archiveProposal,
  convertLeadAndSend,
  ProposalContent
} from '../actions'
import { useProposalForm } from './hooks/use-proposal-form'
import { ProposalEditor } from './components/proposal-editor'
import { ClientSelector } from './components/client-selector'

const NO_CLIENT_LABEL = '(No client linked)' as const

interface ClientUser {
  id: string
  name: string
  email: string
}

interface ProposalVersion {
  id: string
  version: number
  content: ProposalContent
  subtotal: number
  gst_rate: number
  gst_amount: number
  total: number
  sent_at: string | null
  created_at: string
  created_by_employee?: { name: string }
}

interface Proposal {
  id: string
  title: string
  status: string
  current_version: number
  created_at: string
  updated_at: string
  signed_at: string | null
  client_id: string | null
  lead_id: string | null
  project_id: string | null
  client?: { id: string; name: string }
  lead?: { id: string; name: string; email: string }
  project?: { id: string; name: string }
  versions: ProposalVersion[]
  signatures: Array<{
    id: string
    signer_name: string
    signer_email: string
    signed_at: string
    ip_address: string
  }>
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const proposalId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedClientUserId, setSelectedClientUserId] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  // Load current version content
  const currentVersionContent = proposal?.versions?.find(
    v => v.version === proposal.current_version
  )?.content || null

  // Use form hook
  const formActions = useProposalForm(currentVersionContent)
  const { content, hasChanges, setContent, resetChanges } = formActions

  const fetchProposal = useCallback(async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        client:clients(id, name),
        lead:leads(id, name, email),
        project:agency_projects(id, name),
        versions:proposal_versions(
          id, version, content, subtotal, gst_rate, gst_amount, total,
          sent_at, created_at,
          created_by_employee:employees(name)
        ),
        signatures:proposal_signatures(
          id, signer_name, signer_email, signed_at, ip_address
        )
      `)
      .eq('id', proposalId)
      .single()

    if (error || !data) {
      console.error('Error fetching proposal:', error)
      router.push('/admin/proposals')
      return
    }

    setProposal(data as Proposal)

    // Load current version content
    const currentVersion = data.versions?.find(
      (v: ProposalVersion) => v.version === data.current_version
    )
    if (currentVersion) {
      setContent(currentVersion.content as ProposalContent)
    }

    // Fetch client users if we have a client
    if (data.client_id) {
      const { data: users } = await supabase
        .from('client_users')
        .select('id, name, email')
        .eq('client_id', data.client_id)

      if (users) {
        setClientUsers(users)
        // Auto-select if there's only one contact
        if (users.length === 1) {
          setSelectedClientUserId(users[0].id)
        }
      }
    }

    setLoading(false)
  }, [supabase, proposalId, router, setContent])

  useEffect(() => {
    void fetchProposal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save handler
  const handleSave = async () => {
    if (!content || !proposal) return
    setSaving(true)

    const result = await updateProposal(proposal.id, { content })

    if (result.success) {
      resetChanges()
      fetchProposal()
    }

    setSaving(false)
  }

  // Send handler (to client user)
  const handleSend = async () => {
    if (!proposal || !selectedClientUserId || !content) return
    setSending(true)

    // Save any unsaved changes first
    if (hasChanges) {
      const saveResult = await updateProposal(proposal.id, { content })
      if (!saveResult.success) {
        toast.error(saveResult.message)
        setSending(false)
        return
      }
      resetChanges()
    }

    const result = await sendProposal(proposal.id, {
      clientUserId: selectedClientUserId
    })

    if (result.success) {
      setSendDialogOpen(false)
      fetchProposal()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setSending(false)
  }

  // Send handler (to lead - converts to client first)
  const handleSendToLead = async () => {
    if (!proposal || !proposal.lead_id || !content) return
    setSending(true)

    // Save any unsaved changes first
    if (hasChanges) {
      const saveResult = await updateProposal(proposal.id, { content })
      if (!saveResult.success) {
        toast.error(saveResult.message)
        setSending(false)
        return
      }
      resetChanges()
    }

    const result = await convertLeadAndSend(proposal.id, proposal.lead_id)

    if (result.success) {
      setSendDialogOpen(false)
      fetchProposal()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setSending(false)
  }

  // Archive handler
  const handleArchive = async () => {
    if (!proposal) return
    if (!confirm('Are you sure you want to archive this proposal?')) return

    const result = await archiveProposal(proposal.id)
    if (result.success) {
      router.push('/admin/proposals')
    }
  }

  if (loading || !proposal || !content) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    signed: 'bg-green-500',
    archived: 'bg-orange-500',
  }

  const isSigned = proposal.status === 'signed'
  const isArchived = proposal.status === 'archived'
  const canEdit = !isSigned && !isArchived

  // Determine display name for client/lead
  const recipientName = proposal.client?.name ?? proposal.lead?.name
  const recipientDisplay = recipientName ?? NO_CLIENT_LABEL

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/proposals">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <Badge className={statusColors[proposal.status]}>
                {proposal.status}
              </Badge>
              <Badge variant="outline">v{proposal.current_version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {recipientDisplay}
              {proposal.project && ` • ${proposal.project.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button onClick={() => setSendDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
              <Button variant="ghost" onClick={handleArchive}>
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Signed banner */}
      {isSigned && proposal.signatures.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Signed by {proposal.signatures[0].signer_name}
                </p>
                <p className="text-sm text-green-700">
                  {proposal.signatures[0].signer_email} •{' '}
                  {new Date(proposal.signatures[0].signed_at).toLocaleString()} •{' '}
                  IP: {proposal.signatures[0].ip_address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Editor */}
      <ProposalEditor
        content={content}
        versions={proposal.versions}
        currentVersion={proposal.current_version}
        canEdit={canEdit}
        formActions={formActions}
      />

      {/* Client Selector Dialog */}
      <ClientSelector
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        clientId={proposal.client_id}
        leadId={proposal.lead_id}
        lead={proposal.lead}
        clientUsers={clientUsers}
        selectedClientUserId={selectedClientUserId}
        onSelectClientUser={setSelectedClientUserId}
        sending={sending}
        onSendToClient={handleSend}
        onSendToLead={handleSendToLead}
      />
    </div>
  )
}
