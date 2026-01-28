'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { BudgetCard } from './budget-card'
import { InvoicesList } from './invoices-list'
import { formatDistanceToNow } from 'date-fns'

interface Invoice {
  id: string
  invoiceNumber: string | null
  xeroStatus: string | null
  total: number | null
  currency: string
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  paymentStatus: string | null
  paymentStatusUpdatedAt: string | null
  lastPaymentError: string | null
  updatedAt: string | null
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

interface StripeWebhookHealth {
  last_success_at: string | null
  last_error_at: string | null
  last_error_message: string | null
}

export function ProjectFinanceTab({ projectId, clientId, clientName }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeHealth, setStripeHealth] = useState<StripeWebhookHealth | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const invoiceIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

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
        payment_status,
        payment_status_updated_at,
        last_payment_error,
        updated_at,
        client:clients(id, name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch invoices', error)
    } else {
      const mapped = (data || []).map((inv) => {
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
          paymentStatus: inv.payment_status,
          paymentStatusUpdatedAt: inv.payment_status_updated_at,
          lastPaymentError: inv.last_payment_error,
          updatedAt: inv.updated_at,
          client: client || undefined,
        }
      })
      setInvoices(mapped)
      invoiceIdsRef.current = new Set(mapped.map((inv) => inv.id))
    }
    setLoading(false)
  }

  useEffect(() => {
    const channel = supabase
      .channel(`project-invoices-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `project_id=eq.${projectId}` },
        () => {
          fetchInvoices()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          const invoiceId = (payload.new as { invoice_id?: string })?.invoice_id
          if (invoiceId && invoiceIdsRef.current.has(invoiceId)) {
            fetchInvoices()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase])

  useEffect(() => {
    async function fetchStripeHealth() {
      const { data, error } = await supabase
        .from('integration_health')
        .select('last_success_at, last_error_at, last_error_message')
        .eq('key', 'stripe_webhook')
        .maybeSingle()

      if (error) {
        console.warn('Failed to load Stripe webhook health', error)
        return
      }

      setStripeHealth(data)
    }

    fetchStripeHealth()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const lastSuccessAt = stripeHealth?.last_success_at ? new Date(stripeHealth.last_success_at) : null
  const minutesSinceSuccess = lastSuccessAt ? (Date.now() - lastSuccessAt.getTime()) / 60000 : null
  const isWebhookStale = minutesSinceSuccess === null || minutesSinceSuccess > 30
  const lastErrorAt = stripeHealth?.last_error_at ? new Date(stripeHealth.last_error_at) : null

  return (
    <div className="space-y-6">
      {stripeHealth && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            isWebhookStale ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isWebhookStale ? (
            <AlertCircle className="h-4 w-4 mt-0.5" />
          ) : (
            <CheckCircle className="h-4 w-4 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-medium">
              {isWebhookStale
                ? 'Stripe webhook has not confirmed payments recently'
                : 'Stripe webhook is healthy'}
            </p>
            {lastSuccessAt && (
              <p className="text-xs text-muted-foreground">
                Last success {formatDistanceToNow(lastSuccessAt, { addSuffix: true })}
              </p>
            )}
            {isWebhookStale && lastErrorAt && (
              <p className="text-xs text-muted-foreground">
                Last error {formatDistanceToNow(lastErrorAt, { addSuffix: true })}
              </p>
            )}
            {isWebhookStale && stripeHealth.last_error_message && (
              <p className="text-xs text-muted-foreground">{stripeHealth.last_error_message}</p>
            )}
          </div>
        </div>
      )}

      <BudgetCard invoices={invoices} />

      <InvoicesList
        invoices={invoices}
        clientId={clientId}
        clientName={clientName}
        projectId={projectId}
        onRefresh={fetchInvoices}
      />

      {!clientId && (
        <div className="flex items-center gap-2 p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          This project has no client assigned. Assign a client to create invoices.
        </div>
      )}
    </div>
  )
}
