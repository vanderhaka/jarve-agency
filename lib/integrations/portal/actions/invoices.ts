/**
 * Portal Invoice Actions
 * Server actions for invoice retrieval and payment in the client portal
 *
 * Security:
 * - All actions validate token ownership before returning data
 * - Invoice must belong to client associated with portal token
 * - Amount calculations performed server-side only
 */

'use server'

import { createPortalServiceClient } from '@/utils/supabase/portal-service'
import { createCheckoutSession } from '@/lib/integrations/stripe/client'
import type {
  PortalInvoice,
  PortalInvoiceLineItem,
  PortalInvoiceSummary,
  PortalInvoiceStatus,
  PortalPayment,
  PortalPaymentInitResult,
  PortalPaymentErrorResult,
} from '../types'

/**
 * Map xero_status to client-friendly PortalInvoiceStatus
 */
function mapInvoiceStatus(
  xeroStatus: string | null,
  paidAt: string | null,
  dueDate: string | null,
  totalPayments: number,
  total: number | null
): PortalInvoiceStatus {
  // If paid_at is set, invoice is fully paid
  if (paidAt) {
    return 'paid'
  }

  // If total payments meet or exceed invoice total, mark as paid
  if (total && totalPayments >= total) {
    return 'paid'
  }

  // Check for partial payments
  if (totalPayments > 0 && total && totalPayments < total) {
    return 'partially_paid'
  }

  // Map xero_status
  const status = xeroStatus?.toUpperCase()

  switch (status) {
    case 'PAID':
      return 'paid'
    case 'VOIDED':
    case 'DELETED':
      return 'voided'
    case 'DRAFT':
      return 'draft'
    case 'SUBMITTED':
    case 'AUTHORISED':
      // Check if overdue
      if (dueDate) {
        const due = new Date(dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (due < today) {
          return 'overdue'
        }
      }
      return 'sent'
    default:
      return 'draft'
  }
}

/**
 * Validate a token has access to a specific invoice
 * Returns client info if valid, error if not
 */
async function validateTokenForInvoice(
  supabase: ReturnType<typeof createPortalServiceClient>,
  token: string,
  invoiceId: string
): Promise<
  | { valid: true; clientUserId: string; clientId: string; clientEmail: string }
  | { valid: false; error: string }
> {
  // Get token and client user
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('client_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Get client user's client_id and email
  const { data: clientUser, error: userError } = await supabase
    .from('client_users')
    .select('id, client_id, email')
    .eq('id', tokenData.client_user_id)
    .single()

  if (userError || !clientUser) {
    return { valid: false, error: 'Client user not found' }
  }

  // Verify invoice belongs to this client
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, client_id')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return { valid: false, error: 'Invoice not found' }
  }

  if (invoice.client_id !== clientUser.client_id) {
    return { valid: false, error: 'Access denied' }
  }

  return {
    valid: true,
    clientUserId: clientUser.id,
    clientId: clientUser.client_id,
    clientEmail: clientUser.email,
  }
}

/**
 * Get all invoices for a client (via portal token)
 * Returns summary list for display in invoice list view
 */
export async function getPortalInvoices(
  token: string,
  projectId: string
): Promise<
  | { success: true; invoices: PortalInvoiceSummary[] }
  | { success: false; error: string }
> {
  try {
    const supabase = createPortalServiceClient()

    // First validate the token has access to this project
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('client_user_id')
      .eq('token', token)
      .is('revoked_at', null)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or revoked token' }
    }

    // Get client user's client_id
    const { data: clientUser, error: userError } = await supabase
      .from('client_users')
      .select('id, client_id')
      .eq('id', tokenData.client_user_id)
      .single()

    if (userError || !clientUser) {
      return { success: false, error: 'Client user not found' }
    }

    // Verify project belongs to this client
    const { data: project, error: projectError } = await supabase
      .from('agency_projects')
      .select('id, client_id')
      .eq('id', projectId)
      .eq('client_id', clientUser.client_id)
      .single()

    if (projectError || !project) {
      return { success: false, error: 'Project not found or access denied' }
    }

    // Get invoices for this client (can be project-specific or client-wide)
    // For now, show all invoices for the client to give full visibility
    const { data: allInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, xero_status, total, currency, issue_date, due_date, paid_at')
      .eq('client_id', clientUser.client_id)
      .order('issue_date', { ascending: false, nullsFirst: false })

    // Filter out DELETED and VOIDED invoices - they shouldn't be visible to clients
    const invoices = (allInvoices || []).filter((inv) => {
      const status = inv.xero_status?.toUpperCase()
      return status !== 'DELETED' && status !== 'VOIDED'
    })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return { success: false, error: 'Failed to fetch invoices' }
    }

    // Get payment totals for each invoice to determine partial payment status
    const invoiceIds = (invoices || []).map((inv) => inv.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('invoice_id, amount')
      .in('invoice_id', invoiceIds.length > 0 ? invoiceIds : ['00000000-0000-0000-0000-000000000000'])

    // Calculate payment totals per invoice
    const paymentTotals: Record<string, number> = {}
    for (const payment of payments || []) {
      paymentTotals[payment.invoice_id] = (paymentTotals[payment.invoice_id] || 0) + Number(payment.amount)
    }

    // Map to PortalInvoiceSummary
    const summaries: PortalInvoiceSummary[] = (invoices || []).map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      status: mapInvoiceStatus(
        inv.xero_status,
        inv.paid_at,
        inv.due_date,
        paymentTotals[inv.id] || 0,
        inv.total ? Number(inv.total) : null
      ),
      total: inv.total ? Number(inv.total) : null,
      currency: inv.currency,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      paid_at: inv.paid_at,
    }))

    return { success: true, invoices: summaries }
  } catch (error) {
    console.error('Error in getPortalInvoices:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get full invoice details including line items and payments
 */
export async function getPortalInvoiceDetails(
  token: string,
  invoiceId: string
): Promise<{ success: true; invoice: PortalInvoice } | { success: false; error: string }> {
  try {
    const supabase = createPortalServiceClient()

    // Validate token has access to this invoice
    const validation = await validateTokenForInvoice(supabase, token, invoiceId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Fetch invoice with line items and payments
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id, client_id, project_id, invoice_number, currency, subtotal,
        gst_rate, gst_amount, total, issue_date, due_date, paid_at,
        payment_link_url, xero_status, created_at, updated_at
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('id, description, quantity, unit_price, amount, sort_order')
      .eq('invoice_id', invoiceId)
      .order('sort_order', { ascending: true })

    // Fetch payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, invoice_id, amount, payment_date, method, reference, created_at')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false })

    // Calculate total payments for status mapping
    const totalPayments = (payments || []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Map to PortalInvoice
    const portalInvoice: PortalInvoice = {
      id: invoice.id,
      client_id: invoice.client_id,
      project_id: invoice.project_id,
      invoice_number: invoice.invoice_number,
      currency: invoice.currency,
      subtotal: invoice.subtotal ? Number(invoice.subtotal) : null,
      gst_rate: Number(invoice.gst_rate),
      gst_amount: invoice.gst_amount ? Number(invoice.gst_amount) : null,
      total: invoice.total ? Number(invoice.total) : null,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      paid_at: invoice.paid_at,
      payment_link_url: invoice.payment_link_url,
      status: mapInvoiceStatus(
        invoice.xero_status,
        invoice.paid_at,
        invoice.due_date,
        totalPayments,
        invoice.total ? Number(invoice.total) : null
      ),
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      line_items: (lineItems || []).map(
        (li): PortalInvoiceLineItem => ({
          id: li.id,
          description: li.description,
          quantity: Number(li.quantity),
          unit_price: Number(li.unit_price),
          amount: Number(li.amount),
          sort_order: li.sort_order,
        })
      ),
      payments: (payments || []).map(
        (p): PortalPayment => ({
          id: p.id,
          invoice_id: p.invoice_id,
          amount: Number(p.amount),
          payment_date: p.payment_date,
          method: p.method as PortalPayment['method'],
          reference: p.reference,
          created_at: p.created_at,
        })
      ),
    }

    return { success: true, invoice: portalInvoice }
  } catch (error) {
    console.error('Error in getPortalInvoiceDetails:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a Stripe Checkout session for invoice payment
 * Returns checkout URL for redirect
 */
export async function createPortalCheckoutSession(
  token: string,
  invoiceId: string
): Promise<PortalPaymentInitResult | PortalPaymentErrorResult> {
  try {
    const supabase = createPortalServiceClient()

    // Validate token has access to this invoice
    const validation = await validateTokenForInvoice(supabase, token, invoiceId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Fetch invoice details for payment
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, currency, paid_at, xero_status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    // Check if invoice can be paid
    if (invoice.paid_at) {
      return { success: false, error: 'Invoice has already been paid' }
    }

    const status = invoice.xero_status?.toUpperCase()
    if (status === 'VOIDED' || status === 'DELETED') {
      return { success: false, error: 'This invoice cannot be paid' }
    }

    // Draft invoices cannot be paid - they must be sent first
    if (status === 'DRAFT') {
      return { success: false, error: 'Draft invoices cannot be paid' }
    }

    if (!invoice.total || Number(invoice.total) <= 0) {
      return { success: false, error: 'Invalid invoice amount' }
    }

    // Calculate amount due (total minus any partial payments)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    const totalPaid = (payments || []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const amountDue = Number(invoice.total) - totalPaid

    if (amountDue <= 0) {
      // All payments received but paid_at not set - update it
      await supabase
        .from('invoices')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', invoiceId)

      return { success: false, error: 'Invoice has already been paid' }
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amountDue * 100)

    // Get base URL from environment - required for payment redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_SITE_URL environment variable is not configured')
      return { success: false, error: 'Payment system configuration error' }
    }

    const successUrl = `${baseUrl}/portal/${token}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/portal/${token}/payment/cancel?invoice_id=${invoiceId}`

    // Create Stripe Checkout session
    const checkoutResult = await createCheckoutSession({
      invoiceId: invoiceId,
      amount: amountInCents,
      currency: invoice.currency.toLowerCase(),
      customerEmail: validation.clientEmail,
      description: `Invoice ${invoice.invoice_number ?? invoiceId}`,
      successUrl,
      cancelUrl,
      metadata: {
        portal_token: token,
        client_id: validation.clientId,
        invoice_number: invoice.invoice_number ?? '',
        invoice_id: invoiceId,
      },
    })

    if (!checkoutResult.success || !checkoutResult.url) {
      console.error('Failed to create checkout session:', checkoutResult.error)
      return {
        success: false,
        error: checkoutResult.error ?? 'Failed to create payment session',
      }
    }

    // Store checkout session ID on invoice
    await supabase
      .from('invoices')
      .update({ stripe_checkout_session_id: checkoutResult.sessionId })
      .eq('id', invoiceId)

    return {
      success: true,
      checkout_url: checkoutResult.url,
    }
  } catch (error) {
    console.error('Error in createPortalCheckoutSession:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
