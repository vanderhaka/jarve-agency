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
import { EmployeeSelect } from '@/components/employee-select'

export function NewProjectDialog({ clients }: { clients: Array<{ id: string; name: string; email: string }> }) {
  const [open, setOpen] = useState(false)
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
    
    const assignedTo = formData.get('assigned_to') as string

    const { error } = await supabase.from('agency_projects').insert({
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      client_id: formData.get('client_id') || null,
      assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
      created_by: currentEmployeeId,
    })

    if (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to track
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" className="w-full rounded-md border border-input bg-background px-3 py-2" required>
              <option value="web">Web</option>
              <option value="ios">iOS</option>
              <option value="mvp">MVP</option>
              <option value="integration">Integration</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className="w-full rounded-md border border-input bg-background px-3 py-2" required>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_id">Client (Optional)</Label>
            <select id="client_id" name="client_id" className="w-full rounded-md border border-input bg-background px-3 py-2">
              <option value="">None</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign Owner</Label>
            <EmployeeSelect name="assigned_to" />
          </div>
          <Button type="submit">Create Project</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

