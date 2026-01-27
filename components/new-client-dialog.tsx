'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface NewClientDialogProps {
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function NewClientDialog({ onSuccess, open: controlledOpen, onOpenChange, trigger }: NewClientDialogProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const router = useRouter()
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
    const formData = new FormData(e.currentTarget)
    
    const { error } = await supabase.from('clients').insert({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string || null,
      phone: formData.get('phone') as string || null,
      website: formData.get('website') as string || null,
      address: formData.get('address') as string || null,
      status: formData.get('status') as string || 'active',
      notes: formData.get('notes') as string || null,
      created_by: currentEmployeeId,
    })

    if (error) {
      console.error('Error creating client:', error)
      alert('Failed to create client')
      return
    }

    setOpen(false)
    router.refresh()
    onSuccess?.()
  }

  // In controlled mode (open prop provided), don't render DialogTrigger at all
  // This prevents iPad Safari context issues during hydration
  const showTrigger = !isControlled

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        trigger !== undefined ? (
          trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button>New Client</Button>
          </DialogTrigger>
        )
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new client profile
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select 
              id="status" 
              name="status" 
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" placeholder="https://" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <div className="col-span-2 pt-4">
            <Button type="submit" variant="success" className="w-full">Add Client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
