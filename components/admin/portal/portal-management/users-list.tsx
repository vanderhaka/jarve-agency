'use client'

import { useState } from 'react'
import { Plus, LinkIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { usePortalUsers } from './hooks/use-portal-users'
import { TokensManager } from './tokens-manager'

interface UsersListProps {
  clientId: string
  clientName: string
}

export function UsersList({ clientId, clientName }: UsersListProps) {
  const { clientUsers, loading, addUser } = usePortalUsers(clientId)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleAddUser() {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Name and email are required')
      return
    }

    setCreating(true)
    try {
      await addUser(newUserName, newUserEmail)
      setNewUserName('')
      setNewUserEmail('')
      setShowAddDialog(false)
      toast.success('Client user added')
    } catch (error) {
      toast.error('Failed to add user')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Portal Users</CardTitle>
          <CardDescription>
            Manage users who can access the client portal
          </CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Portal User</DialogTitle>
              <DialogDescription>
                Add a new user who can access {clientName}&apos;s portal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleAddUser} disabled={creating}>
                {creating ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {clientUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No portal users yet</p>
            <p className="text-sm">Add a user to generate a portal access link</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientUsers.map((user) => (
              <TokensManager key={user.id} user={user} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
