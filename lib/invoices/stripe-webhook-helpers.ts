/**
 * Stripe Webhook Helpers
 * Pure functions for processing Stripe webhook events
 * These are separated from the webhook route for testability
 */

export interface StripeCheckoutSession {
  id: string
  payment_intent: string | null
  metadata?: {
    invoice_id?: string
  }
  amount_total?: number | null
}

export interface PaymentRecord {
  invoiceId: string
  amount: number
  paymentDate: string
  method: string
  reference: string | null
  stripePaymentIntentId: string | null
}

export interface XeroPaymentParams {
  xeroInvoiceId: string
  amount: number
  paymentDate: string
}

/**
 * Extract invoice ID from Stripe checkout session
 */
export function extractInvoiceId(session: StripeCheckoutSession): string | null {
  return session.metadata?.invoice_id || null
}

/**
 * Calculate payment amount from session
 * Stripe amounts are in cents, we convert to dollars
 */
export function calculatePaymentAmount(
  sessionAmountTotal: number | null | undefined,
  invoiceTotal: number
): number {
  if (sessionAmountTotal && sessionAmountTotal > 0) {
    return sessionAmountTotal / 100 // Convert cents to dollars
  }
  return invoiceTotal
}

/**
 * Build payment record from checkout session
 */
export function buildPaymentRecord(
  session: StripeCheckoutSession,
  invoiceTotal: number
): PaymentRecord | null {
  const invoiceId = extractInvoiceId(session)
  if (!invoiceId) {
    return null
  }

  const amount = calculatePaymentAmount(session.amount_total, invoiceTotal)
  const paymentDate = new Date().toISOString().split('T')[0]

  return {
    invoiceId,
    amount,
    paymentDate,
    method: 'stripe',
    reference: session.payment_intent,
    stripePaymentIntentId: session.payment_intent,
  }
}

/**
 * Build Xero payment params
 */
export function buildXeroPaymentParams(
  xeroInvoiceId: string,
  amount: number
): XeroPaymentParams {
  return {
    xeroInvoiceId,
    amount,
    paymentDate: new Date().toISOString().split('T')[0],
  }
}

/**
 * Validate webhook event type
 */
export function isCheckoutCompleteEvent(eventType: string): boolean {
  return eventType === 'checkout.session.completed'
}

/**
 * Validate payment intent failed event
 */
export function isPaymentFailedEvent(eventType: string): boolean {
  return eventType === 'payment_intent.payment_failed'
}
