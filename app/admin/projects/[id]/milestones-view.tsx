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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, GripVertical, Check, Trash2, Edit, Receipt } from 'lucide-react'
import type { Milestone, MilestoneStatus } from '@/lib/milestones/types'
import {
  createMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
  reorderMilestonesAction,
  completeMilestoneAction,
} from './milestone-actions'

interface Props {
  projectId: string
  milestones: Milestone[]
}

const statusColors: Record<MilestoneStatus, string> = {
  planned: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
}

const statusLabels: Record<MilestoneStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  complete: 'Complete',
  invoiced: 'Invoiced',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
              <DialogDescription>Create a new milestone for this project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Design Phase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (excl. GST) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as MilestoneStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDeposit"
                      checked={isDeposit}
                      onChange={e => setIsDeposit(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isDeposit" className="font-normal">Deposit milestone</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !title || !amount}>
                Create Milestone
              </Button>
            </DialogFooter>
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
                <div
                  key={milestone.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{milestone.title}</span>
                      {milestone.is_deposit && (
                        <Badge variant="outline" className="text-xs">Deposit</Badge>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground truncate">{milestone.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(Number(milestone.amount))}</div>
                    <div className="text-xs text-muted-foreground">
                      + {formatCurrency(Number(milestone.amount) * milestone.gst_rate)} GST
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground w-24">
                    {formatDate(milestone.due_date)}
                  </div>
                  <Badge className={statusColors[milestone.status]}>
                    {statusLabels[milestone.status]}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(milestone)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {milestone.status !== 'complete' && milestone.status !== 'invoiced' && (
                        <DropdownMenuItem onClick={() => handleComplete(milestone.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      {milestone.invoice_id && (
                        <DropdownMenuItem>
                          <Receipt className="h-4 w-4 mr-2" />
                          View Invoice
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(milestone.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
            <DialogDescription>Update the milestone details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount (excl. GST) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as MilestoneStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit-isDeposit"
                    checked={isDeposit}
                    onChange={e => setIsDeposit(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isDeposit" className="font-normal">Deposit milestone</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMilestone(null)}>
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
