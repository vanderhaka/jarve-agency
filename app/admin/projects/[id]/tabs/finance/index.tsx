'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { BudgetCard } from './budget-card'
import { InvoicesList } from './invoices-list'

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

export function ProjectFinanceTab({ projectId, clientId, clientName }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
