'use client'

import { useEffect, useState, useTransition } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  RefreshCw,
  DollarSign,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string | null
  xeroStatus: string | null
  total: number | null
  currency: string
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  client?: {
    id: string
    name: string
  }
}

interface Props {
  projectId: string
  clientId: string | null
  clientName: string | null
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  AUTHORISED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800',
  DELETED: 'bg-red-100 text-red-800',
}

export function ProjectFinanceTab({ projectId, clientId, clientName }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [gstRate, setGstRate] = useState(0.1)
  const supabase = createClient()

  // Form state for creating invoice
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 },
  ])

  useEffect(() => {
    fetchInvoices()
    fetchGstRate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function fetchGstRate() {
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('gst_rate')
      .single()
    
    if (settings?.gst_rate !== null && settings?.gst_rate !== undefined) {
      setGstRate(settings.gst_rate)
    }
  }

  async function fetchInvoices() {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        xero_status,
        total,
        currency,
        issue_date,
        due_date,
        paid_at,
        client:clients(id, name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch invoices', error)
    } else {
      setInvoices(
        (data || []).map((inv) => {
          // Handle the client join - it could be an object or null
          const clientData = inv.client as { id: string; name: string } | { id: string; name: string }[] | null
          const client = Array.isArray(clientData) ? clientData[0] : clientData
          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            xeroStatus: inv.xero_status,
            total: inv.total,
            currency: inv.currency,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            paidAt: inv.paid_at,
            client: client || undefined,
          }
        })
      )
    }
    setLoading(false)
  }

  async function handleCreateInvoice() {
    if (!clientId) {
      alert('This project has no client assigned')
      return
    }

    startTransition(async () => {
      const { createInvoice } = await import('@/app/actions/invoices/actions')
      const result = await createInvoice({
        clientId,
        projectId,
        lineItems: lineItems.filter((item) => item.description.trim() !== ''),
      })

      if (result.success) {
        setShowCreateDialog(false)
        setLineItems([{ description: '', quantity: 1, unitPrice: 0 }])
        fetchInvoices()
      } else {
        alert(result.error || 'Failed to create invoice')
      }
    })
  }

  async function handleSyncStatus(invoiceId: string) {
    setSyncing(invoiceId)
    const { syncInvoiceStatus } = await import('@/app/actions/invoices/actions')
    await syncInvoiceStatus(invoiceId)
    await fetchInvoices()
    setSyncing(null)
  }

  async function handleMarkPaid(invoiceId: string) {
    startTransition(async () => {
      const { markInvoicePaid } = await import('@/app/actions/invoices/actions')
      const result = await markInvoicePaid(invoiceId)

      if (result.success) {
        setShowMarkPaidDialog(null)
        fetchInvoices()
      } else {
        alert(result.error || 'Failed to mark as paid')
      }
    })
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function updateLineItem(index: number, field: string, value: string | number) {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const gstAmount = totalAmount * gstRate
  const grandTotal = totalAmount + gstAmount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter((i) => i.xeroStatus === 'PAID').length}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {invoices.filter((i) => i.xeroStatus === 'AUTHORISED').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Payment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              ${invoices
                .filter((i) => i.xeroStatus === 'PAID')
                .reduce((sum, i) => sum + (i.total || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Received</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Manage project invoices and payments
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button disabled={!clientId}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Draft Invoice</DialogTitle>
                <DialogDescription>
                  Create a new invoice for {clientName || 'this project'}. It will be synced to Xero as a Draft.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label>Line Items</Label>
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(index, 'description', e.target.value)
                          }
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="w-24 text-right pt-2 font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST ({(gstRate * 100).toFixed(0)}%)</span>
                    <span>${gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Draft Invoice'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Create your first invoice for this project</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.invoiceNumber || 'Draft'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[invoice.xeroStatus || 'DRAFT'] ||
                          statusColors.DRAFT
                        }
                      >
                        {invoice.xeroStatus || 'DRAFT'}
                      </Badge>
                      {invoice.paidAt && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(invoice.paidAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.issueDate
                        ? new Date(invoice.issueDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${invoice.total?.toLocaleString() || '0.00'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSyncStatus(invoice.id)}
                          disabled={syncing === invoice.id}
                          title="Sync status from Xero"
                        >
                          {syncing === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        {invoice.xeroStatus !== 'PAID' && (
                          <Dialog
                            open={showMarkPaidDialog === invoice.id}
                            onOpenChange={(open) =>
                              setShowMarkPaidDialog(open ? invoice.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Mark as paid"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark Invoice as Paid</DialogTitle>
                                <DialogDescription>
                                  This will record the payment locally and post it
                                  to Xero.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <p className="text-sm mb-2">
                                  <strong>Invoice:</strong>{' '}
                                  {invoice.invoiceNumber || 'Draft'}
                                </p>
                                <p className="text-sm">
                                  <strong>Amount:</strong> $
                                  {invoice.total?.toLocaleString() || '0.00'}
                                </p>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowMarkPaidDialog(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleMarkPaid(invoice.id)}
                                  disabled={isPending}
                                >
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
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm" title="View details">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* No Client Warning */}
      {!clientId && (
        <div className="flex items-center gap-2 p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          This project has no client assigned. Assign a client to create invoices.
        </div>
      )}
    </div>
  )
}
