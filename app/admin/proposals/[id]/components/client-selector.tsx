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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Send } from 'lucide-react'

interface ClientUser {
  id: string
  name: string
  email: string
}

interface Lead {
  id: string
  name: string
  email: string
}

interface ClientSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string | null
  leadId: string | null
  lead?: Lead
  clientUsers: ClientUser[]
  selectedClientUserId: string
  onSelectClientUser: (userId: string) => void
  sending: boolean
  onSendToClient: () => void
  onSendToLead: () => void
}

export function ClientSelector({
  open,
  onOpenChange,
  clientId,
  leadId,
  lead,
  clientUsers,
  selectedClientUserId,
  onSelectClientUser,
  sending,
  onSendToClient,
  onSendToLead
}: ClientSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Proposal</DialogTitle>
          <DialogDescription>
            {clientId
              ? 'Select a client contact to send this proposal to.'
              : lead
                ? `Send this proposal to ${lead.name} (${lead.email}). This will convert them to a client.`
                : 'Link a lead or client to this proposal before sending.'}
          </DialogDescription>
        </DialogHeader>
        {clientId ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Send to</Label>
                <Select
                  value={selectedClientUserId}
                  onValueChange={onSelectClientUser}
                >
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
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={onSendToClient}
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
          </>
        ) : lead ? (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={onSendToLead} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to {lead.name}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
