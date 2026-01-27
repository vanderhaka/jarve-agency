'use client'

interface ClientUser {
  id: string
  name: string
  email: string
}

interface UsersSectionProps {
  clientUsers: ClientUser[]
}

export function UsersSection({ clientUsers }: UsersSectionProps) {
  // Placeholder for future client user management
  // Currently users are only used by MSA section for selecting recipients

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Client users: {clientUsers.length}
      </div>

      {clientUsers.length > 0 && (
        <div className="space-y-2">
          {clientUsers.map((user) => (
            <div key={user.id} className="p-3 border rounded-md">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
