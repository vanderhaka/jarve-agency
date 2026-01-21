'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InviteEmployeeState } from '@/lib/admin/invite'

type InviteEmployeeAction = (
  prevState: InviteEmployeeState,
  formData: FormData
) => Promise<InviteEmployeeState>

interface InviteEmployeeFormProps {
  action: InviteEmployeeAction
  initialState: InviteEmployeeState
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send Invite'}
    </Button>
  )
}

export function InviteEmployeeForm({ action, initialState }: InviteEmployeeFormProps) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required placeholder="Jane Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="name@company.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
          defaultValue="employee"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="md:col-span-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {state.message && (
          <p
            className={`text-sm ${state.status === 'error' ? 'text-destructive' : 'text-emerald-600'}`}
            role="status"
          >
            {state.message}
          </p>
        )}
        <div className="md:ml-auto">
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
