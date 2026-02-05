'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info, Check, X } from 'lucide-react'
import type { SeoAlert } from '@/lib/seo/alerts'

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<SeoAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetchAlerts(controller.signal)
    return () => controller.abort()
  }, [])

  async function fetchAlerts(signal?: AbortSignal) {
    try {
      const res = await fetch('/api/admin/alerts', { signal })
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch alerts:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'acknowledge' | 'resolve') {
    try {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading alerts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No active alerts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        {alert.message && (
                          <p className="text-xs mt-1 opacity-90">
                            {alert.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          {alert.status === 'acknowledged' && (
                            <Badge variant="outline" className="text-xs">
                              Acknowledged
                            </Badge>
                          )}
                          <span className="text-xs opacity-70">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {alert.status === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(alert.id, 'acknowledge')}
                        className="h-7 px-2 text-xs"
                      >
                        Ack
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(alert.id, 'resolve')}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
