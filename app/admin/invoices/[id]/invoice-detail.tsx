'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Building2,
  Calendar,
  Receipt,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Invoice {
  id: string
  invoice_number: string | null
  xero_invoice_id: string | null
  xero_status: string | null
  currency: string
  subtotal: number | null
  gst_rate: number
  gst_amount: number | null
  total: number | null
  issue_date: string | null
  due_date: string | null
  paid_at: string | null
  last_synced_at: string | null
  created_at: string
  client?: {
    id: string
    name: string
    email: string | null
    xero_contact_id: string | null
  } | null
  project?: {
    id: string
    name: string
  } | null
  line_items: Array<{
    id: string
    description: string
    quantity: number
    unit_price: number
    amount: number
    sort_order: number
  }>
  payments: Array<{
    id: string
    amount: number
    payment_date: string
    method: string | null
    reference: string | null
  }>
}

interface Props {
  invoice: Invoice
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  AUTHORISED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800',
  DELETED: 'bg-red-100 text-red-800',
}

export function InvoiceDetail({ invoice }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState(invoice)
  const [isPending, startTransition] = useTransition()

  async function handleSyncStatus() {
    setSyncing(true)
    const { syncInvoiceStatus } = await import('@/app/actions/invoices/actions')
    const result = await syncInvoiceStatus(invoice.id)
    if (result.success && result.status) {
      setCurrentInvoice((prev) => ({
        ...prev,
        xero_status: result.status!,
        last_synced_at: new Date().toISOString(),
      }))
    }
    setSyncing(false)
  }

  async function handleMarkPaid() {
    startTransition(async () => {
      const { markInvoicePaid } = await import('@/app/actions/invoices/actions')
      const result = await markInvoicePaid(invoice.id)

      if (result.success) {
        setCurrentInvoice((prev) => ({
          ...prev,
          xero_status: 'PAID',
          paid_at: new Date().toISOString(),
        }))
        setShowMarkPaidDialog(false)
      } else {
        alert(result.error || 'Failed to mark as paid')
      }
    })
  }

  const totalPaid = currentInvoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const amountDue = (currentInvoice.total || 0) - totalPaid

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={currentInvoice.project ? `/admin/projects/${currentInvoice.project.id}?tab=finance` : '/admin/projects'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {currentInvoice.invoice_number || 'Draft Invoice'}
              </h1>
              <Badge
                className={
                  statusColors[currentInvoice.xero_status || 'DRAFT'] ||
                  statusColors.DRAFT
                }
              >
                {currentInvoice.xero_status || 'DRAFT'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {currentInvoice.client && (
                <Link
                  href={`/admin/clients/${currentInvoice.client.id}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Building2 className="h-3 w-3" />
                  {currentInvoice.client.name}
                </Link>
              )}
              {currentInvoice.project && (
                <Link
                  href={`/admin/projects/${currentInvoice.project.id}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  {currentInvoice.project.name}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncStatus} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync from Xero
          </Button>
          {currentInvoice.xero_status !== 'PAID' && (
            <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark Paid
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Invoice as Paid</DialogTitle>
                  <DialogDescription>
                    This will record the payment locally and post it to Xero.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm mb-2">
                    <strong>Invoice:</strong> {currentInvoice.invoice_number || 'Draft'}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> ${currentInvoice.total?.toLocaleString() || '0.00'}
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkPaid} disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Paid
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Issue Date
            </div>
            <div className="font-medium">
              {currentInvoice.issue_date
                ? new Date(currentInvoice.issue_date).toLocaleDateString()
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Due Date
            </div>
            <div className="font-medium">
              {currentInvoice.due_date
                ? new Date(currentInvoice.due_date).toLocaleDateString()
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Receipt className="h-4 w-4" />
              Total
            </div>
            <div className="text-xl font-bold">
              ${currentInvoice.total?.toLocaleString() || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Amount Due
            </div>
            <div className={`text-xl font-bold ${amountDue > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              ${amountDue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentInvoice.line_items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${currentInvoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST ({(currentInvoice.gst_rate * 100).toFixed(0)}%)</span>
              <span>${currentInvoice.gst_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${currentInvoice.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      {currentInvoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              Payment history for this invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.method || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sync Info */}
      <div className="text-xs text-muted-foreground">
        {currentInvoice.xero_invoice_id && (
          <p>Xero Invoice ID: {currentInvoice.xero_invoice_id}</p>
        )}
        {currentInvoice.last_synced_at && (
          <p>
            Last synced:{' '}
            {formatDistanceToNow(new Date(currentInvoice.last_synced_at), {
              addSuffix: true,
            })}
          </p>
        )}
      </div>
    </div>
  )
}
