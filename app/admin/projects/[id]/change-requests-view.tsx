'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, MoreVertical, Send, Archive, Trash2, Edit, ExternalLink, Copy, Check, X } from 'lucide-react'
import type { ChangeRequest, ChangeRequestStatus } from '@/lib/change-requests/types'
import {
  createChangeRequestAction,
  updateChangeRequestAction,
  deleteChangeRequestAction,
  sendChangeRequestAction,
  archiveChangeRequestAction,
} from './change-request-actions'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface Props {
  projectId: string
  changeRequests: ChangeRequest[]
}

const statusColors: Record<ChangeRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-100 text-slate-800',
}

const statusLabels: Record<ChangeRequestStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting Signature',
  signed: 'Signed',
  rejected: 'Rejected',
  archived: 'Archived',
}

export function ChangeRequestsView({ projectId, changeRequests: initialChangeRequests }: Props) {
  const [changeRequests, setChangeRequests] = useState(initialChangeRequests)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCR, setEditingCR] = useState<ChangeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setAmount('')
  }

  const openEditDialog = (cr: ChangeRequest) => {
    setEditingCR(cr)
    setTitle(cr.title)
    setDescription(cr.description || '')
    setAmount(cr.amount.toString())
  }

  const handleCreate = async () => {
    if (!title || !amount) return
    setIsLoading(true)

    const result = await createChangeRequestAction({
      project_id: projectId,
      title,
      description: description || null,
      amount: parseFloat(amount),
    })

    if (result.success && result.changeRequest) {
      setChangeRequests([result.changeRequest, ...changeRequests])
      setIsCreateOpen(false)
      resetForm()
    }
    setIsLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingCR || !title || !amount) return
    setIsLoading(true)

    const result = await updateChangeRequestAction(editingCR.id, projectId, {
      title,
      description: description || null,
      amount: parseFloat(amount),
    })

    if (result.success && result.changeRequest) {
      setChangeRequests(changeRequests.map(cr => (cr.id === editingCR.id ? result.changeRequest! : cr)))
      setEditingCR(null)
      resetForm()
    }
    setIsLoading(false)
  }

  const handleDelete = async (crId: string) => {
    if (!confirm('Are you sure you want to delete this change request?')) return
    setIsLoading(true)

    const result = await deleteChangeRequestAction(crId, projectId)

    if (result.success) {
      setChangeRequests(changeRequests.filter(cr => cr.id !== crId))
    }
    setIsLoading(false)
  }

  const handleSend = async (crId: string) => {
    if (!confirm('Send this change request to the client for signing?')) return
    setIsLoading(true)

    const result = await sendChangeRequestAction(crId, projectId)

    if (result.success && result.changeRequest) {
      setChangeRequests(changeRequests.map(cr => (cr.id === crId ? result.changeRequest! : cr)))
    }
    setIsLoading(false)
  }

  const handleArchive = async (crId: string) => {
    setIsLoading(true)

    const result = await archiveChangeRequestAction(crId, projectId)

    if (result.success && result.changeRequest) {
      setChangeRequests(changeRequests.map(cr => (cr.id === crId ? result.changeRequest! : cr)))
    }
    setIsLoading(false)
  }

  const copyPortalLink = (cr: ChangeRequest) => {
    if (!cr.portal_token) return
    const link = `${window.location.origin}/portal/change-request/${cr.portal_token}`
    navigator.clipboard.writeText(link)
    setCopiedId(cr.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter out archived
  const activeChangeRequests = changeRequests.filter(cr => cr.status !== 'archived')

  // Calculate totals
  const totalAmount = activeChangeRequests.reduce((sum, cr) => sum + Number(cr.amount), 0)
  const signedAmount = activeChangeRequests
    .filter(cr => cr.status === 'signed')
    .reduce((sum, cr) => sum + Number(cr.amount), 0)
  const pendingCount = activeChangeRequests.filter(cr => cr.status === 'sent').length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activeChangeRequests.length}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Awaiting Signature</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(signedAmount)}</div>
            <div className="text-sm text-muted-foreground">Approved Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              New Change Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Change Request</DialogTitle>
              <DialogDescription>Create a change request for additional work or scope changes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cr-title">Title *</Label>
                <Input
                  id="cr-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Additional Landing Page"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cr-description">Description</Label>
                <Textarea
                  id="cr-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the scope of work..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cr-amount">Amount (excl. GST) *</Label>
                <Input
                  id="cr-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    Total with GST: {formatCurrency(parseFloat(amount) * 1.10)}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !title || !amount}>
                Create Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Change Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Change Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {activeChangeRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No change requests yet. Create one when you need to charge for additional work.
            </div>
          ) : (
            <div className="space-y-2">
              {activeChangeRequests.map(cr => (
                <div
                  key={cr.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{cr.title}</span>
                    </div>
                    {cr.description && (
                      <p className="text-sm text-muted-foreground truncate">{cr.description}</p>
                    )}
                    {cr.status === 'signed' && cr.signer_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Signed by {cr.signer_name} on {formatDate(cr.signed_at)}
                      </p>
                    )}
                    {cr.status === 'rejected' && cr.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">
                        Rejected: {cr.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(Number(cr.amount))}</div>
                    <div className="text-xs text-muted-foreground">
                      + {formatCurrency(Number(cr.amount) * 0.10)} GST
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground w-24">
                    {formatDate(cr.created_at)}
                  </div>
                  <Badge className={statusColors[cr.status]}>
                    {statusLabels[cr.status]}
                  </Badge>
                  <TooltipProvider>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {cr.status === 'draft' && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(cr)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSend(cr.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send for Signature
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(cr.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {cr.status === 'sent' && cr.portal_token && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => copyPortalLink(cr)}>
                                  {copiedId === cr.id ? (
                                    <Check className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Copy className="h-4 w-4 mr-2" />
                                  )}
                                  {copiedId === cr.id ? 'Copied!' : 'Copy Portal Link'}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                Copy the signing link to share with the client
                              </TooltipContent>
                            </Tooltip>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/portal/change-request/${cr.portal_token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Preview Portal
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchive(cr.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {(cr.status === 'signed' || cr.status === 'rejected') && (
                          <DropdownMenuItem onClick={() => handleArchive(cr.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCR} onOpenChange={open => !open && setEditingCR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Change Request</DialogTitle>
            <DialogDescription>Update the change request details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cr-title">Title *</Label>
              <Input
                id="edit-cr-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cr-description">Description</Label>
              <Textarea
                id="edit-cr-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cr-amount">Amount (excl. GST) *</Label>
              <Input
                id="edit-cr-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Total with GST: {formatCurrency(parseFloat(amount) * 1.10)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCR(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading || !title || !amount}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
