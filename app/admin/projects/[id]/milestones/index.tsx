'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import type { Milestone, MilestoneStatus } from '@/lib/milestones/types'
import {
  createMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
  completeMilestoneAction,
} from '../milestone-actions'
import { MilestoneCard } from './milestone-card'
import { MilestoneForm } from './milestone-form'
import { formatCurrency } from './types'

interface Props {
  projectId: string
  milestones: Milestone[]
}

export function MilestonesView({ projectId, milestones: initialMilestones }: Props) {
  const [milestones, setMilestones] = useState(initialMilestones)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<MilestoneStatus>('planned')
  const [isDeposit, setIsDeposit] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setAmount('')
    setDueDate('')
    setStatus('planned')
    setIsDeposit(false)
  }

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setTitle(milestone.title)
    setDescription(milestone.description || '')
    setAmount(milestone.amount.toString())
    setDueDate(milestone.due_date || '')
    setStatus(milestone.status)
    setIsDeposit(milestone.is_deposit)
  }

  const handleCreate = async () => {
    if (!title || !amount) return
    setIsLoading(true)

    const result = await createMilestoneAction({
      project_id: projectId,
      title,
      description: description || null,
      amount: parseFloat(amount),
      due_date: dueDate || null,
      status,
      is_deposit: isDeposit,
    })

    if (result.success && result.milestone) {
      setMilestones([...milestones, result.milestone])
      setIsCreateOpen(false)
      resetForm()
    }
    setIsLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingMilestone || !title || !amount) return
    setIsLoading(true)

    const result = await updateMilestoneAction(editingMilestone.id, projectId, {
      title,
      description: description || null,
      amount: parseFloat(amount),
      due_date: dueDate || null,
      status,
      is_deposit: isDeposit,
    })

    if (result.success && result.milestone) {
      setMilestones(milestones.map(m => (m.id === editingMilestone.id ? result.milestone! : m)))
      setEditingMilestone(null)
      resetForm()
    }
    setIsLoading(false)
  }

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return
    setIsLoading(true)

    const result = await deleteMilestoneAction(milestoneId, projectId)

    if (result.success) {
      setMilestones(milestones.filter(m => m.id !== milestoneId))
    }
    setIsLoading(false)
  }

  const handleComplete = async (milestoneId: string) => {
    if (!confirm('Mark this milestone as complete? This will trigger invoice creation when integrated with Xero.')) return
    setIsLoading(true)

    const result = await completeMilestoneAction(milestoneId, projectId)

    if (result.success && result.milestone) {
      setMilestones(milestones.map(m => (m.id === milestoneId ? result.milestone! : m)))
    }
    setIsLoading(false)
  }

  // Calculate totals
  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount), 0)
  const invoicedAmount = milestones
    .filter(m => m.status === 'invoiced')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{milestones.length}</div>
            <div className="text-sm text-muted-foreground">Total Milestones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(invoicedAmount)}</div>
            <div className="text-sm text-muted-foreground">Invoiced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(totalAmount - invoicedAmount)}</div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              mode="create"
              title={title}
              description={description}
              amount={amount}
              dueDate={dueDate}
              status={status}
              isDeposit={isDeposit}
              isLoading={isLoading}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onAmountChange={setAmount}
              onDueDateChange={setDueDate}
              onStatusChange={setStatus}
              onIsDepositChange={setIsDeposit}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No milestones yet. Create your first milestone to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  onEdit={openEditDialog}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={open => !open && setEditingMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
          </DialogHeader>
          <MilestoneForm
            mode="edit"
            title={title}
            description={description}
            amount={amount}
            dueDate={dueDate}
            status={status}
            isDeposit={isDeposit}
            isLoading={isLoading}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onAmountChange={setAmount}
            onDueDateChange={setDueDate}
            onStatusChange={setStatus}
            onIsDepositChange={setIsDeposit}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMilestone(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
