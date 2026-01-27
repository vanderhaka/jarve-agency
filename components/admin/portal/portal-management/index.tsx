'use client'

import { UsersList } from './users-list'

interface PortalManagementProps {
  clientId: string
  clientName: string
}

export function PortalManagement({ clientId, clientName }: PortalManagementProps) {
  return (
    <div className="space-y-6">
      <UsersList clientId={clientId} clientName={clientName} />
    </div>
  )
}
