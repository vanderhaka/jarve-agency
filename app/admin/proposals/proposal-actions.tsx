'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Send, Eye, Archive, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { sendProposal, archiveProposal } from './actions'
import { createClient } from '@/utils/supabase/client'

interface ProposalActionsProps {
  proposalId: string
  proposalTitle: string
  status: string
  clientId: string | null
}

interface ClientUser {
  id: string
  name: string
  email: string
}

export function ProposalActions({ proposalId, proposalTitle, status, clientId }: ProposalActionsProps) {
  const router = useRouter()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [selectedClientUserId, setSelectedClientUserId] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const canEdit = status !== 'signed' && status !== 'archived'

  const handleOpenSendDialog = async () => {
    if (!clientId) {
      toast.error('Link a client to this proposal first')
      return
    }

    setLoadingUsers(true)
    setSendDialogOpen(true)

    const supabase = createClient()
    const { data: users } = await supabase
      .from('client_users')
      .select('id, name, email')
      .eq('client_id', clientId)

    if (users) {
      setClientUsers(users)
    }
    setLoadingUsers(false)
  }

  const handleSend = async () => {
    if (!selectedClientUserId) return
    setSending(true)

    const result = await sendProposal(proposalId, {
      clientUserId: selectedClientUserId
    })

    if (result.success) {
      setSendDialogOpen(false)
      setSelectedClientUserId('')
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }

    setSending(false)
  }

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${proposalTitle}"?`)) return

    const result = await archiveProposal(proposalId)
    if (result.success) {
      toast.success('Proposal archived')
      router.refresh()
    } else {
      toast.error('Failed to archive proposal')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/proposals/${proposalId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View / Edit
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuItem
                onClick={handleOpenSendDialog}
                disabled={!clientId}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to Client
                {!clientId && <span className="ml-2 text-xs text-muted-foreground">(no client)</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleArchive}
                className="text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
            <DialogDescription>
              Send &quot;{proposalTitle}&quot; to a client contact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Send to</Label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading contacts...
                </div>
              ) : (
                <Select
                  value={selectedClientUserId}
                  onValueChange={setSelectedClientUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUsers.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No contacts found
                      </SelectItem>
                    ) : (
                      clientUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedClientUserId || sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
