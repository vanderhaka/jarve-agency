'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, FileSignature, CheckCircle, Send, Plus, Clock } from 'lucide-react'
import { createMSA, sendMSA } from '@/app/admin/proposals/msa-actions'

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

interface ClientMSACardProps {
  clientId: string
  clientName: string
}

export function ClientMSACard({ clientId, clientName }: ClientMSACardProps) {
  const [loading, setLoading] = useState(true)
  const [msa, setMsa] = useState<MSA | null>(null)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [creating, setCreating] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [msaRes, usersRes] = await Promise.all([
      supabase
        .from('client_msas')
        .select('id, title, status, sent_at, signed_at, signer_name, signer_email')
        .eq('client_id', clientId)
        .single(),
      supabase
        .from('client_users')
        .select('id, name, email')
        .eq('client_id', clientId)
    ])

    if (msaRes.data) {
      setMsa(msaRes.data)
    }

    if (usersRes.data) {
      setClientUsers(usersRes.data)
    }

    setLoading(false)
  }, [supabase, clientId])

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateMSA = async () => {
    setCreating(true)
    const result = await createMSA({ clientId })
    if (result.success) {
      fetchData()
    }
    setCreating(false)
  }

  const handleSendMSA = async () => {
    if (!msa || !selectedUserId) return
    setSending(true)

    const result = await sendMSA(msa.id, { clientUserId: selectedUserId })
    if (result.success) {
      setSendDialogOpen(false)
      fetchData()
      alert(`MSA sent! Portal URL: ${result.portalUrl}`)
    } else {
      alert(result.message)
    }

    setSending(false)
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

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    signed: 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Master Service Agreement</CardTitle>
              <CardDescription>
                One-time agreement required before active work
              </CardDescription>
            </div>
          </div>
          {msa && (
            <Badge className={statusColors[msa.status]}>
              {msa.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!msa ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No MSA has been created for {clientName} yet.
            </p>
            <Button onClick={handleCreateMSA} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create MSA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
                <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" /> Resend
                    </Button>
                  </DialogTrigger>
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
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Draft MSA</p>
                  <p className="text-sm text-muted-foreground">
                    Ready to send for signature
                  </p>
                </div>
                <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="h-4 w-4 mr-2" /> Send for Signing
                    </Button>
                  </DialogTrigger>
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
              </div>
            )}

            {clientUsers.length === 0 && msa.status !== 'signed' && (
              <p className="text-sm text-amber-600">
                No client contacts found. Add a contact before sending the MSA.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
