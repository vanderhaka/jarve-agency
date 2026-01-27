'use client'

import { Button } from '@/components/ui/button'
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { MilestoneStatus } from '@/lib/milestones/types'

interface MilestoneFormProps {
  mode: 'create' | 'edit'
  title: string
  description: string
  amount: string
  dueDate: string
  status: MilestoneStatus
  isDeposit: boolean
  isLoading: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onAmountChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onStatusChange: (value: MilestoneStatus) => void
  onIsDepositChange: (value: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

export function MilestoneForm({
  mode,
  title,
  description,
  amount,
  dueDate,
  status,
  isDeposit,
  isLoading,
  onTitleChange,
  onDescriptionChange,
  onAmountChange,
  onDueDateChange,
  onStatusChange,
  onIsDepositChange,
  onSubmit,
  onCancel,
}: MilestoneFormProps) {
  const isFormValid = title.trim() !== '' && amount.trim() !== ''

  return (
    <>
      <DialogDescription>
        {mode === 'create' ? 'Create a new milestone for this project.' : 'Update the milestone details.'}
      </DialogDescription>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-title`}>Title *</Label>
          <Input
            id={`${mode}-title`}
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={mode === 'create' ? 'e.g., Design Phase' : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-description`}>Description</Label>
          <Textarea
            id={`${mode}-description`}
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder={mode === 'create' ? 'Optional description...' : undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-amount`}>Amount (excl. GST) *</Label>
            <Input
              id={`${mode}-amount`}
              type="number"
              step="0.01"
              value={amount}
              onChange={e => onAmountChange(e.target.value)}
              placeholder={mode === 'create' ? '0.00' : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-dueDate`}>Due Date</Label>
            <Input
              id={`${mode}-dueDate`}
              type="date"
              value={dueDate}
              onChange={e => onDueDateChange(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-status`}>Status</Label>
            <Select value={status} onValueChange={v => onStatusChange(v as MilestoneStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                {mode === 'edit' && <SelectItem value="invoiced">Invoiced</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id={`${mode}-isDeposit`}
                checked={isDeposit}
                onChange={e => onIsDepositChange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor={`${mode}-isDeposit`} className="font-normal">Deposit milestone</Label>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading || !isFormValid}>
          {mode === 'create' ? 'Create Milestone' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  )
}
