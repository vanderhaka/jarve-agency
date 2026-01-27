import type { InvoiceWithDetails } from './types'

/**
 * Map database invoice to InvoiceWithDetails type
 */
export function mapInvoiceToDetails(invoice: Record<string, unknown>): InvoiceWithDetails {
  const client = invoice.client as Record<string, unknown> | null
  const project = invoice.project as Record<string, unknown> | null
  const lineItems = (invoice.line_items || []) as Array<Record<string, unknown>>
  const payments = (invoice.payments || []) as Array<Record<string, unknown>>

  return {
    id: invoice.id as string,
    clientId: invoice.client_id as string | null,
    projectId: invoice.project_id as string | null,
    xeroInvoiceId: invoice.xero_invoice_id as string | null,
    xeroStatus: invoice.xero_status as string | null,
    invoiceNumber: invoice.invoice_number as string | null,
    currency: invoice.currency as string,
    subtotal: invoice.subtotal as number | null,
    gstRate: invoice.gst_rate as number,
    gstAmount: invoice.gst_amount as number | null,
    total: invoice.total as number | null,
    issueDate: invoice.issue_date as string | null,
    dueDate: invoice.due_date as string | null,
    paidAt: invoice.paid_at as string | null,
    paymentLinkUrl: invoice.payment_link_url as string | null,
    lastSyncedAt: invoice.last_synced_at as string | null,
    createdAt: invoice.created_at as string,
    client: client
      ? {
          id: client.id as string,
          name: client.name as string,
          email: client.email as string | null,
          xeroContactId: client.xero_contact_id as string | null,
        }
      : undefined,
    project: project
      ? {
          id: project.id as string,
          name: project.name as string,
        }
      : undefined,
    lineItems: lineItems.map((item) => ({
      id: item.id as string,
      description: item.description as string,
      quantity: item.quantity as number,
      unitPrice: item.unit_price as number,
      amount: item.amount as number,
      sortOrder: item.sort_order as number,
    })),
    payments: payments.map((payment) => ({
      id: payment.id as string,
      amount: payment.amount as number,
      paymentDate: payment.payment_date as string,
      method: payment.method as string | null,
      reference: payment.reference as string | null,
    })),
  }
}
