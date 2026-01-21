import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InviteEmployeeForm } from '@/app/admin/employees/invite-employee-form'
import type { InviteEmployeeState } from '@/lib/admin/invite'

const noopAction = async (state: InviteEmployeeState) => state

describe('InviteEmployeeForm', () => {
  it('renders fields and default role', () => {
    render(
      <InviteEmployeeForm
        action={noopAction}
        initialState={{ status: 'idle', message: null }}
      />
    )

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement
    expect(roleSelect).toBeInTheDocument()
    expect(roleSelect.value).toBe('employee')
  })

  it('shows success message styling', () => {
    render(
      <InviteEmployeeForm
        action={noopAction}
        initialState={{ status: 'success', message: 'Invite sent.' }}
      />
    )

    const message = screen.getByText('Invite sent.')
    expect(message).toHaveClass('text-emerald-600')
  })

  it('shows error message styling', () => {
    render(
      <InviteEmployeeForm
        action={noopAction}
        initialState={{ status: 'error', message: 'Invite failed.' }}
      />
    )

    const message = screen.getByText('Invite failed.')
    expect(message).toHaveClass('text-destructive')
  })
})
