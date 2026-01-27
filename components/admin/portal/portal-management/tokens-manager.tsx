'use client'

import { Copy, RefreshCw, Trash2, Eye, ExternalLink, LinkIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { usePortalTokens } from './hooks/use-portal-tokens'
import type { ClientUser } from './hooks/use-portal-users'

interface TokensManagerProps {
  user: ClientUser
}

export function TokensManager({ user }: TokensManagerProps) {
  const {
    status,
    loading,
    generating,
    revoking,
    generateLink,
    revokeLink,
    copyToClipboard,
  } = usePortalTokens(user.id)

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
                      onClick={generateLink}
                      disabled={generating}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {generating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={revokeLink}
                      disabled={revoking}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {revoking ? 'Revoking...' : 'Revoke'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={generateLink} disabled={generating}>
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
