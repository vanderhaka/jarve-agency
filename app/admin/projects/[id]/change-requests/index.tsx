'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { ChangeRequest } from '@/lib/change-requests/types'
import {
  createChangeRequestAction,
  updateChangeRequestAction,
  deleteChangeRequestAction,
  sendChangeRequestAction,
  archiveChangeRequestAction,
} from '../change-request-actions'
import { ApprovalWorkflow } from './approval-workflow'
import { RequestCard } from './request-card'
import { RequestForm } from './request-form'

interface Props {
  projectId: string
  changeRequests: ChangeRequest[]
}

export function ChangeRequestsView({ projectId, changeRequests: initialChangeRequests }: Props) {
  const [changeRequests, setChangeRequests] = useState(initialChangeRequests)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCR, setEditingCR] = useState<ChangeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      <ApprovalWorkflow
        totalRequests={activeChangeRequests.length}
        pendingCount={pendingCount}
        signedAmount={signedAmount}
        totalAmount={totalAmount}
      />

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Change Request
        </Button>
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
                <RequestCard
                  key={cr.id}
                  changeRequest={cr}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  onSend={handleSend}
                  onArchive={handleArchive}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Form */}
      <RequestForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title={title}
        description={description}
        amount={amount}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onAmountChange={setAmount}
        onSubmit={handleCreate}
        isLoading={isLoading}
        mode="create"
      />

      {/* Edit Form */}
      <RequestForm
        open={!!editingCR}
        onOpenChange={open => !open && setEditingCR(null)}
        title={title}
        description={description}
        amount={amount}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onAmountChange={setAmount}
        onSubmit={handleUpdate}
        isLoading={isLoading}
        mode="edit"
      />
    </div>
  )
}
