'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ChangeRequest } from '@/lib/change-requests/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  amount: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onAmountChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  mode: 'create' | 'edit'
}

export function RequestForm({
  open,
  onOpenChange,
  title,
  description,
  amount,
  onTitleChange,
  onDescriptionChange,
  onAmountChange,
  onSubmit,
  isLoading,
  mode,
}: Props) {
  const isValid = title && amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New Change Request' : 'Edit Change Request'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a change request for additional work or scope changes.'
              : 'Update the change request details.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cr-title">Title *</Label>
            <Input
              id="cr-title"
              value={title}
              onChange={e => onTitleChange(e.target.value)}
              placeholder={mode === 'create' ? 'e.g., Additional Landing Page' : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cr-description">Description</Label>
            <Textarea
              id="cr-description"
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder={mode === 'create' ? 'Describe the scope of work...' : undefined}
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
              onChange={e => onAmountChange(e.target.value)}
              placeholder={mode === 'create' ? '0.00' : undefined}
            />
            {amount && (
              <p className="text-sm text-muted-foreground">
                Total with GST: {formatCurrency(parseFloat(amount) * 1.10)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !isValid}>
            {mode === 'create' ? 'Create Draft' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
