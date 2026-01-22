'use client'

import { EmployeesTable } from './employees-table'

interface Employee {
  id: string
  name: string | null
  email: string
  role: string
  created_at: string | null
}

interface EmployeesTableWrapperProps {
  employees: Employee[]
  currentUserId: string
}

export function EmployeesTableWrapper({ employees, currentUserId }: EmployeesTableWrapperProps) {
  const handleInviteClick = () => {
    const inviteForm = document.getElementById('invite-form')
    if (inviteForm) {
      inviteForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const emailInput = inviteForm.querySelector('input[name="email"]') as HTMLInputElement
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 300)
      }
    }
  }

  return (
    <EmployeesTable
      employees={employees}
      currentUserId={currentUserId}
      onInviteClick={handleInviteClick}
    />
  )
}
