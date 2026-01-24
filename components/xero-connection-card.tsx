'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Link2, Link2Off, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface XeroConnection {
  id: string
  tenant_id: string
  tenant_name: string | null
  is_active: boolean
  connected_at: string
}

export function XeroConnectionCard() {
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connection, setConnection] = useState<XeroConnection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for URL params from OAuth callback
    const xeroConnected = searchParams.get('xero_connected')
    const xeroError = searchParams.get('xero_error')

    if (xeroConnected === 'true') {
      setSuccess('Xero connected successfully!')
      // Clear the URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (xeroError) {
      const errorMessages: Record<string, string> = {
        missing_params: 'OAuth callback missing parameters',
        invalid_state: 'OAuth state validation failed',
        unauthorized: 'Please log in to connect Xero',
        admin_required: 'Admin access required to connect Xero',
        token_exchange_failed: 'Failed to exchange authorization code',
        no_tenants: 'No Xero organizations found',
        storage_failed: 'Failed to save connection',
        unexpected: 'An unexpected error occurred',
      }
      setError(errorMessages[xeroError] || `Xero error: ${xeroError}`)
      window.history.replaceState({}, '', window.location.pathname)
    }

    fetchConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function fetchConnection() {
    try {
      const { data, error: fetchError } = await supabase
        .from('xero_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (fetchError) {
        console.error('Failed to fetch Xero connection', { error: fetchError })
      } else {
        setConnection(data)
      }
    } catch (err) {
      console.error('Error fetching Xero connection', { error: err })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    // Navigate to the connect endpoint
    window.location.href = '/api/xero/connect'
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/xero/disconnect', { method: 'POST' })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to disconnect')
        return
      }

      setConnection(null)
      setSuccess('Xero disconnected successfully')
    } catch (err) {
      console.error('Disconnect error', { error: err })
      setError('Failed to disconnect from Xero')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            {connection ? (
              <Link2 className="h-8 w-8 text-primary" />
            ) : (
              <Link2Off className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <CardTitle>Xero Integration</CardTitle>
            <CardDescription>
              Connect to Xero for invoicing and payment sync
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {connection ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    {connection.tenant_name || connection.tenant_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected {new Date(connection.connected_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to sync invoices and payments with Xero
                  </p>
                </div>
              </>
            )}
          </div>
          {connection ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          ) : (
            <Button onClick={handleConnect}>Connect Xero</Button>
          )}
        </div>

        {/* Features */}
        {!connection && (
          <div className="space-y-2">
            <p className="text-sm font-medium">What you get with Xero:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Create draft invoices directly from projects</li>
              <li>- Sync invoice status and PDFs automatically</li>
              <li>- Record payments back to Xero (manual or via Stripe)</li>
              <li>- GST calculated at 10% (tax exclusive)</li>
            </ul>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-md">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Environment Variables Note */}
        {!connection && (
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
            <strong>Note:</strong> Requires XERO_CLIENT_ID and XERO_CLIENT_SECRET environment
            variables to be configured.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
