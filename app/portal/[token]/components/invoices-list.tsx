'use client'

import { useState, useEffect, useRef } from 'react'
import { Receipt, Loader2, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { usePortal } from './portal-context'
import { getPortalInvoices } from '@/lib/integrations/portal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InvoiceDetailModal } from './invoice-detail-modal'
import type { PortalInvoiceSummary, PortalInvoiceStatus } from '@/lib/integrations/portal/types'

interface InvoicesListProps {
  initialInvoices: PortalInvoiceSummary[]
  initialProjectId: string | null
}

const statusConfig: Record<
  PortalInvoiceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }
> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  sent: { label: 'Sent', variant: 'outline', icon: Receipt },
  viewed: { label: 'Viewed', variant: 'outline', icon: Receipt },
  partially_paid: { label: 'Partial', variant: 'default', icon: DollarSign },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
  overdue: { label: 'Overdue', variant: 'destructive', icon: AlertCircle },
  voided: { label: 'Voided', variant: 'secondary', icon: Clock },
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function InvoicesList({ initialInvoices, initialProjectId }: InvoicesListProps) {
  const { token, selectedProject } = usePortal()
  const [invoices, setInvoices] = useState<PortalInvoiceSummary[]>(initialInvoices)
  const [loading, setLoading] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const currentProjectIdRef = useRef<string | null>(initialProjectId)

  // Fetch invoices when project changes
  useEffect(() => {
    if (!selectedProject) return

    const projectId = selectedProject.id

    // Skip if this is the initial project (data already loaded from server)
    if (projectId === currentProjectIdRef.current) return

    // Update ref immediately to track which project we're fetching for
    currentProjectIdRef.current = projectId

    async function fetchInvoices() {
      setLoading(true)
      try {
        const result = await getPortalInvoices(token, projectId)
        // Check if this is still the current project before updating state
        if (currentProjectIdRef.current !== projectId) return
        if (result.success) {
          setInvoices(result.invoices)
        } else {
          toast.error(result.error)
        }
      } catch {
        // Check if this is still the current project before showing error
        if (currentProjectIdRef.current !== projectId) return
        toast.error('Failed to load invoices')
      } finally {
        // Only update loading state if this is still the current project
        if (currentProjectIdRef.current === projectId) {
          setLoading(false)
        }
      }
    }

    fetchInvoices()
  }, [token, selectedProject])

  if (!selectedProject) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No project selected</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">View and pay invoices for your projects</p>
      </div>

      {/* Invoices list */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading invoices...</p>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices will appear here once they are created
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const config = statusConfig[invoice.status]
            const StatusIcon = config.icon
            const isPaid = invoice.status === 'paid'
            const isPayable = !isPaid && invoice.status !== 'voided' && invoice.status !== 'draft'

            return (
              <Card
                key={invoice.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedInvoiceId(invoice.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {invoice.invoice_number ?? `Invoice #${invoice.id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Issued {formatDate(invoice.issue_date)}</span>
                          {invoice.due_date && !isPaid && (
                            <>
                              <span>-</span>
                              <span>Due {formatDate(invoice.due_date)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </p>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      {isPayable && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInvoiceId(invoice.id)
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Invoice detail modal */}
      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  )
}
