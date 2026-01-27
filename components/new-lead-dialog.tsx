'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/utils/supabase/client'
import { EmployeeSelect } from '@/components/employee-select'

interface NewLeadDialogProps {
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function NewLeadDialog({ onSuccess, open: controlledOpen, onOpenChange, trigger }: NewLeadDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEmployee() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentEmployeeId(user.id)
      }
    }
    fetchEmployee()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    const email = formData.get('email') as string
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g., name@example.com)')
      return
    }

    const assignedTo = formData.get('assigned_to') as string

    const { error: insertError } = await supabase.from('leads').insert({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string || null,
      status: formData.get('status') as string || 'new',
      amount: parseFloat(formData.get('amount') as string) || 0,
      source: formData.get('source') as string || null,
      assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
      created_by: currentEmployeeId,
    })

    if (insertError) {
      console.error('Error creating lead:', insertError)
      if (insertError.code === '23505') {
        setError('A lead with this email already exists')
      } else {
        setError('Failed to create lead. Please try again.')
      }
      return
    }

    setOpen(false)
    onSuccess?.()
  }

  // In controlled mode (open prop provided), don't render DialogTrigger at all
  // This prevents iPad Safari context issues during hydration
  const showTrigger = !isControlled

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) setError(null); }}>
      {showTrigger && (
        trigger !== undefined ? (
          trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button variant="success">Add Lead</Button>
          </DialogTrigger>
        )
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Manually add a new lead to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              title="Please enter a valid email address (e.g., name@example.com)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select 
              id="status" 
              name="status" 
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input id="source" name="source" placeholder="e.g. LinkedIn, Website" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Value (Estimated)</Label>
            <Input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <EmployeeSelect name="assigned_to" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="message">Message/Notes</Label>
            <Textarea id="message" name="message" rows={4} />
          </div>
          {error && (
            <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
          <div className="col-span-2">
            <Button type="submit" className="w-full">Create Lead</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
