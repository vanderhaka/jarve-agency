'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, CreditCard, AlertCircle, RefreshCw } from 'lucide-react'
import { usePortal } from './portal-context'
import { getPortalInvoiceDetails } from '@/lib/integrations/portal'
import { buildInvoiceTimeline } from '@/lib/invoices/status'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InvoiceTimeline } from '@/components/invoices/invoice-timeline'
import type { PortalInvoice, PortalInvoiceStatus } from '@/lib/integrations/portal/types'

interface InvoiceDetailModalProps {
  invoiceId: string | null
  onClose: () => void
}

const statusConfig: Record<PortalInvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'outline' },
  viewed: { label: 'Viewed', variant: 'outline' },
  partially_paid: { label: 'Partially Paid', variant: 'default' },
  processing: { label: 'Processing', variant: 'outline' },
  payment_failed: { label: 'Payment Failed', variant: 'destructive' },
  paid: { label: 'Paid', variant: 'default' },
  refunded: { label: 'Refunded', variant: 'secondary' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  voided: { label: 'Voided', variant: 'secondary' },
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

export function InvoiceDetailModal({ invoiceId, onClose }: InvoiceDetailModalProps) {
  const { token } = usePortal()
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null)
      return
    }

    async function fetchInvoice(id: string) {
      setLoading(true)
      try {
        const result = await getPortalInvoiceDetails(token, id)
        if (result.success) {
          setInvoice(result.invoice)
        } else {
          toast.error(result.error)
          onClose()
        }
      } catch {
        toast.error('Failed to load invoice details')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice(invoiceId)
  }, [token, invoiceId, onClose])

  const refreshInvoice = useCallback(async () => {
    if (!invoiceId) return
    setRefreshing(true)
    try {
      const result = await getPortalInvoiceDetails(token, invoiceId)
      if (result.success) {
        setInvoice(result.invoice)
      }
    } finally {
      setRefreshing(false)
    }
  }, [invoiceId, token])

  useEffect(() => {
    if (!invoice || invoice.status !== 'processing') return

    const interval = setInterval(() => {
      refreshInvoice()
    }, 8000)

    return () => clearInterval(interval)
  }, [invoice, refreshInvoice])

  async function handlePayNow() {
    if (!invoice) return

    setPaying(true)
    try {
      const response = await fetch('/api/portal/invoices/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, invoiceId: invoice.id }),
      })

      const result = await response.json()

      if (result.success && result.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  const isOpen = invoiceId !== null
  const totalPaid = invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0
  const isPaid = invoice?.status === 'paid' || (invoice?.status === 'partially_paid' && totalPaid >= (invoice?.total ?? 0))

  // Calculate amount due
  const amountDue = invoice?.total ? invoice.total - totalPaid : 0

  // Only payable if not paid, not voided, not draft, and has amount due > 0
  const isPayable = invoice &&
    !isPaid &&
    invoice.status !== 'voided' &&
    invoice.status !== 'draft' &&
    invoice.status !== 'processing' &&
    invoice.status !== 'refunded' &&
    amountDue > 0

  const processingUpdatedAt = invoice?.payment_status_updated_at
    ? new Date(invoice.payment_status_updated_at).getTime()
    : null
  const processingAgeMs = processingUpdatedAt ? Date.now() - processingUpdatedAt : 0
  const isProcessingStale = invoice?.status === 'processing' && processingAgeMs > 2 * 60 * 1000

  const timelineEvents = invoice
    ? buildInvoiceTimeline({
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paidAt: invoice.paid_at,
        paymentStatus: invoice.payment_status,
        paymentStatusUpdatedAt: invoice.payment_status_updated_at,
        xeroStatus: null,
        lastSyncedAt: null,
        createdAt: invoice.created_at,
        includeXero: false,
      })
    : []

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">
                    {invoice.invoice_number ?? `Invoice #${invoice.id.slice(0, 8)}`}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Issued {formatDate(invoice.issue_date)}
                    {invoice.due_date && ` - Due ${formatDate(invoice.due_date)}`}
                  </p>
                </div>
                <Badge variant={statusConfig[invoice.status].variant}>
                  {statusConfig[invoice.status].label}
                </Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Line Items */}
              <div>
                <h3 className="text-sm font-medium mb-3">Line Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60%]">Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.line_items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unit_price, invoice.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.subtotal, invoice.currency)}
                        </TableCell>
                      </TableRow>
                      {invoice.gst_amount !== null && invoice.gst_amount > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-right">
                            GST ({invoice.gst_rate}%)
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.gst_amount, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Payment History */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {invoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">
                              {payment.method === 'stripe' ? 'Card Payment' :
                               payment.method === 'bank_transfer' ? 'Bank Transfer' :
                               payment.method ?? 'Payment'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payment.payment_date)}
                              {payment.reference && ` - ${payment.reference}`}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium text-green-600">
                          {formatCurrency(payment.amount, invoice.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Due */}
              {!isPaid && amountDue > 0 && (
                <>
                  <div className="border-t my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Amount Due</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(amountDue, invoice.currency)}
                    </span>
                  </div>
                </>
              )}

              {/* Status Timeline */}
              {timelineEvents.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Status timeline</h3>
                    {invoice.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshInvoice}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <InvoiceTimeline events={timelineEvents} />
                </div>
              )}

              {/* Payment status messaging */}
              {invoice.status === 'processing' && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">
                      {isProcessingStale ? 'Still confirming payment' : 'Payment received — confirming'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isProcessingStale
                        ? 'This is taking longer than usual. If you were charged, no action is needed. Please refresh in a few minutes or contact support.'
                        : 'This usually updates within a minute. You can refresh if needed.'}
                    </p>
                  </div>
                </div>
              )}

              {invoice.status === 'payment_failed' && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600">Payment failed</p>
                    {invoice.last_payment_error && (
                      <p className="text-sm text-muted-foreground">{invoice.last_payment_error}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Please try again or contact support.</p>
                  </div>
                </div>
              )}

              {/* Pay Now Button */}
              {isPayable && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayNow}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formatCurrency(amountDue, invoice.currency)} Now
                    </>
                  )}
                </Button>
              )}

              {/* Paid confirmation */}
              {isPaid && (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">
                    {invoice.paid_at ? `Paid on ${formatDate(invoice.paid_at)}` : 'Paid'}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
