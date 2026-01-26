'use client'

import { useState, useEffect } from 'react'
import { Plus, Link as LinkIcon, Copy, RefreshCw, Trash2, Eye, ExternalLink } from 'lucide-react'
import {
  createClientPortalToken,
  revokeClientPortalToken,
  getClientPortalStatus,
} from '@/lib/integrations/portal'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface ClientUser {
  id: string
  name: string
  email: string
  created_at: string
}

interface PortalManagementProps {
  clientId: string
  clientName: string
}

export function PortalManagement({ clientId, clientName }: PortalManagementProps) {
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [creating, setCreating] = useState(false)

  // Fetch client users
  useEffect(() => {
    async function fetchClientUsers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_users')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setClientUsers(data)
      }
      setLoading(false)
    }
    fetchClientUsers()
  }, [clientId])

  async function handleAddUser() {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Name and email are required')
      return
    }

    setCreating(true)
    try {
      const supabase = createClient()
      const { data: user, error } = await supabase
        .from('client_users')
        .insert({
          client_id: clientId,
          name: newUserName.trim(),
          email: newUserEmail.trim(),
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to add user')
        return
      }

      setClientUsers((prev) => [user, ...prev])
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
    <div className="space-y-6">
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
                <Button onClick={handleAddUser} disabled={creating}>
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
                <ClientUserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ClientUserCardProps {
  user: ClientUser
}

function ClientUserCard({ user }: ClientUserCardProps) {
  const [status, setStatus] = useState<{
    hasActiveToken: boolean
    url: string | null
    viewCount: number
    lastViewedAt: string | null
    tokenId: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    async function fetchStatus() {
      const result = await getClientPortalStatus(user.id)
      setStatus({
        hasActiveToken: result.hasActiveToken,
        url: result.url,
        viewCount: result.viewCount,
        lastViewedAt: result.lastViewedAt,
        tokenId: result.token?.id || null,
      })
      setLoading(false)
    }
    fetchStatus()
  }, [user.id])

  async function handleGenerateLink() {
    setGenerating(true)
    try {
      const result = await createClientPortalToken(user.id)
      if (result.success) {
        setStatus({
          hasActiveToken: true,
          url: result.url,
          viewCount: 0,
          lastViewedAt: null,
          tokenId: result.token.id,
        })
        toast.success('Portal link generated')
      } else {
        toast.error(result.error || 'Failed to generate link')
      }
    } catch (error) {
      toast.error('Failed to generate link')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevokeLink() {
    if (!status?.tokenId) return

    setRevoking(true)
    try {
      const result = await revokeClientPortalToken(status.tokenId)
      if (result.success) {
        setStatus({
          hasActiveToken: false,
          url: null,
          viewCount: 0,
          lastViewedAt: null,
          tokenId: null,
        })
        toast.success('Portal link revoked')
      } else {
        toast.error(result.error || 'Failed to revoke link')
      }
    } catch (error) {
      toast.error('Failed to revoke link')
    } finally {
      setRevoking(false)
    }
  }

  function copyToClipboard() {
    if (status?.url) {
      navigator.clipboard.writeText(status.url)
      toast.success('Link copied to clipboard')
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Added {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : status?.hasActiveToken ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="secondary">No link</Badge>
            )}
          </div>
        </div>

        {!loading && (
          <div className="mt-4 space-y-3">
            {status?.hasActiveToken && status.url ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={status.url}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={status.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {status.viewCount} views
                    </span>
                    {status.lastViewedAt && (
                      <span>
                        Last viewed: {new Date(status.lastViewedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateLink}
                      disabled={generating}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {generating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRevokeLink}
                      disabled={revoking}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {revoking ? 'Revoking...' : 'Revoke'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={handleGenerateLink} disabled={generating}>
                <LinkIcon className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Portal Link'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
