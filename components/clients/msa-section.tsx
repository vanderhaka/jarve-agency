'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, CheckCircle, Send, Plus, Clock } from 'lucide-react'
import { sendMSA } from '@/app/admin/proposals/msa-actions'

interface MSA {
  id: string
  title: string
  status: string
  sent_at: string | null
  signed_at: string | null
  signer_name: string | null
  signer_email: string | null
}

interface ClientUser {
  id: string
  name: string
  email: string
}

interface MSASectionProps {
  msa: MSA | null
  clientName: string
  clientUsers: ClientUser[]
  creating: boolean
  onCreateMSA: () => void
  onMSAUpdated: () => void
}

export function MSASection({
  msa,
  clientName,
  clientUsers,
  creating,
  onCreateMSA,
  onMSAUpdated
}: MSASectionProps) {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [sending, setSending] = useState(false)

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    signed: 'bg-green-500'
  }

  const handleSendMSA = async () => {
    if (!msa || !selectedUserId) return
    setSending(true)

    const result = await sendMSA(msa.id, { clientUserId: selectedUserId })
    if (result.success) {
      setSendDialogOpen(false)
      onMSAUpdated()
      alert(`MSA sent! Portal URL: ${result.portalUrl}`)
    } else {
      alert(result.message)
    }

    setSending(false)
  }

  const sendButton = msa?.status === 'sent' ? (
    <Button variant="outline" size="sm" onClick={() => setSendDialogOpen(true)}>
      <Send className="h-4 w-4 mr-2" /> Resend
    </Button>
  ) : (
    <Button onClick={() => setSendDialogOpen(true)}>
      <Send className="h-4 w-4 mr-2" /> Send for Signing
    </Button>
  )

  const sendDialogContent = (
    <>
      {sendButton}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Send MSA</DialogTitle>
          <DialogDescription>
            Select a contact to send the MSA for signing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Send to</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {clientUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendMSA} disabled={!selectedUserId || sending}>
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

  if (!msa) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-4">
          No MSA has been created for {clientName} yet.
        </p>
        <Button onClick={onCreateMSA} disabled={creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create MSA
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-2">
        <Badge className={statusColors[msa.status]}>
          {msa.status}
        </Badge>
      </div>

      {msa.status === 'signed' ? (
        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">MSA Signed</p>
            <p className="text-sm text-green-700">
              Signed by {msa.signer_name} ({msa.signer_email}) on{' '}
              {new Date(msa.signed_at!).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : msa.status === 'sent' ? (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">Awaiting Signature</p>
              <p className="text-sm text-blue-700">
                Sent on {new Date(msa.sent_at!).toLocaleDateString()}
              </p>
            </div>
          </div>
          {sendDialogContent}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-semibold">Draft MSA</p>
            <p className="text-sm text-muted-foreground">
              Ready to send for signature
            </p>
          </div>
          {sendDialogContent}
        </div>
      )}

      {clientUsers.length === 0 && msa.status !== 'signed' && (
        <p className="text-sm text-amber-600">
          No client contacts found. Add a contact before sending the MSA.
        </p>
      )}
    </div>
  )
}
