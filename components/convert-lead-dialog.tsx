'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmployeeSelect } from '@/components/employee-select'
import { convertLeadToProject, type ConvertLeadInput } from '@/app/admin/leads/actions'
import { ArrowRightCircle, Loader2 } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  company?: string | null
  message?: string | null
}

interface ConvertLeadDialogProps {
  lead: Lead
}

export function ConvertLeadDialog({ lead }: ConvertLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const assignedTo = formData.get('assigned_to') as string

    const input: ConvertLeadInput = {
      projectName: (formData.get('project_name') as string) || lead.name,
      projectType: formData.get('project_type') as ConvertLeadInput['projectType'],
      projectStatus: formData.get('project_status') as ConvertLeadInput['projectStatus'],
      assignedTo: assignedTo === 'unassigned' ? null : assignedTo,
    }

    const result = await convertLeadToProject(lead.id, input)

    setLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    setOpen(false)

    // Navigate to the new project
    if (result.projectId) {
      router.push(`/admin/projects/${result.projectId}`)
    } else {
      router.push('/admin/projects')
    }
  }

  // Default project name from lead name or company
  const defaultProjectName = lead.company
    ? `${lead.company} - ${lead.name}`
    : lead.name

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <ArrowRightCircle className="h-4 w-4" />
        Convert to Project
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead to Project</DialogTitle>
          <DialogDescription>
            Create a new client (if needed) and project from this lead. The lead will be archived after conversion.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name</Label>
            <Input
              id="project_name"
              name="project_name"
              defaultValue={defaultProjectName}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_type">Project Type</Label>
            <select
              id="project_type"
              name="project_type"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue="web"
              required
            >
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="branding">Branding</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_status">Initial Status</Label>
            <select
              id="project_status"
              name="project_status"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              defaultValue="planning"
              required
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign Owner (optional)</Label>
            <EmployeeSelect name="assigned_to" />
          </div>

          <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
            <p className="font-medium">What will happen:</p>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>A client record will be created (or linked if email exists)</li>
              <li>A new project will be created under that client</li>
              <li>This lead will be marked as converted and archived</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert Lead
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
