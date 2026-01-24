import { describe, expect, it } from 'vitest'
import {
  extractInvoiceId,
  calculatePaymentAmount,
  buildPaymentRecord,
  buildXeroPaymentParams,
  isCheckoutCompleteEvent,
  isPaymentFailedEvent,
  type StripeCheckoutSession,
} from '@/lib/invoices/stripe-webhook-helpers'

describe('extractInvoiceId', () => {
  it('extracts invoice ID from metadata', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: 'pi_test_456',
      metadata: { invoice_id: 'inv-uuid-123' },
      amount_total: 11000,
    }

    const result = extractInvoiceId(session)

    expect(result).toBe('inv-uuid-123')
  })

  it('returns null when metadata is missing', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: 'pi_test_456',
      amount_total: 11000,
    }

    const result = extractInvoiceId(session)

    expect(result).toBeNull()
  })

  it('returns null when invoice_id is not in metadata', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: 'pi_test_456',
      metadata: {},
      amount_total: 11000,
    }

    const result = extractInvoiceId(session)

    expect(result).toBeNull()
  })
})

describe('calculatePaymentAmount', () => {
  it('converts cents to dollars from session amount', () => {
    const result = calculatePaymentAmount(11000, 100)

    expect(result).toBe(110) // $110.00
  })

  it('uses invoice total when session amount is null', () => {
    const result = calculatePaymentAmount(null, 100)

    expect(result).toBe(100)
  })

  it('uses invoice total when session amount is undefined', () => {
    const result = calculatePaymentAmount(undefined, 100)

    expect(result).toBe(100)
  })

  it('uses invoice total when session amount is zero', () => {
    const result = calculatePaymentAmount(0, 100)

    expect(result).toBe(100)
  })

  it('handles decimal amounts correctly', () => {
    const result = calculatePaymentAmount(9999, 100) // $99.99 in cents

    expect(result).toBe(99.99)
  })
})

describe('buildPaymentRecord', () => {
  it('builds complete payment record', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: 'pi_test_456',
      metadata: { invoice_id: 'inv-uuid-123' },
      amount_total: 11000,
    }

    const result = buildPaymentRecord(session, 100)

    expect(result).not.toBeNull()
    expect(result?.invoiceId).toBe('inv-uuid-123')
    expect(result?.amount).toBe(110)
    expect(result?.method).toBe('stripe')
    expect(result?.reference).toBe('pi_test_456')
    expect(result?.stripePaymentIntentId).toBe('pi_test_456')
    expect(result?.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/) // ISO date format
  })

  it('returns null when invoice ID is missing', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: 'pi_test_456',
      amount_total: 11000,
    }

    const result = buildPaymentRecord(session, 100)

    expect(result).toBeNull()
  })

  it('handles null payment intent', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_123',
      payment_intent: null,
      metadata: { invoice_id: 'inv-uuid-123' },
      amount_total: 11000,
    }

    const result = buildPaymentRecord(session, 100)

    expect(result?.reference).toBeNull()
    expect(result?.stripePaymentIntentId).toBeNull()
  })
})

describe('buildXeroPaymentParams', () => {
  it('builds Xero payment params', () => {
    const result = buildXeroPaymentParams('xero-inv-123', 110)

    expect(result.xeroInvoiceId).toBe('xero-inv-123')
    expect(result.amount).toBe(110)
    expect(result.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isCheckoutCompleteEvent', () => {
  it('returns true for checkout.session.completed', () => {
    expect(isCheckoutCompleteEvent('checkout.session.completed')).toBe(true)
  })

  it('returns false for other events', () => {
    expect(isCheckoutCompleteEvent('payment_intent.succeeded')).toBe(false)
    expect(isCheckoutCompleteEvent('charge.succeeded')).toBe(false)
    expect(isCheckoutCompleteEvent('')).toBe(false)
  })
})

describe('isPaymentFailedEvent', () => {
  it('returns true for payment_intent.payment_failed', () => {
    expect(isPaymentFailedEvent('payment_intent.payment_failed')).toBe(true)
  })

  it('returns false for other events', () => {
    expect(isPaymentFailedEvent('payment_intent.succeeded')).toBe(false)
    expect(isPaymentFailedEvent('checkout.session.completed')).toBe(false)
    expect(isPaymentFailedEvent('')).toBe(false)
  })
})

describe('Stripe webhook integration scenarios', () => {
  it('processes a typical Stripe checkout completion', () => {
    // Simulate a $110 payment (with GST) for a $100 subtotal invoice
    const session: StripeCheckoutSession = {
      id: 'cs_live_abc123',
      payment_intent: 'pi_live_xyz789',
      metadata: { invoice_id: 'inv-12345' },
      amount_total: 11000, // $110.00 in cents
    }

    // 1. Check event type
    expect(isCheckoutCompleteEvent('checkout.session.completed')).toBe(true)

    // 2. Extract invoice ID
    const invoiceId = extractInvoiceId(session)
    expect(invoiceId).toBe('inv-12345')

    // 3. Build payment record
    const paymentRecord = buildPaymentRecord(session, 110)
    expect(paymentRecord).toEqual({
      invoiceId: 'inv-12345',
      amount: 110,
      paymentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      method: 'stripe',
      reference: 'pi_live_xyz789',
      stripePaymentIntentId: 'pi_live_xyz789',
    })

    // 4. Build Xero payment (if invoice has Xero ID)
    const xeroParams = buildXeroPaymentParams('xero-12345', 110)
    expect(xeroParams).toEqual({
      xeroInvoiceId: 'xero-12345',
      amount: 110,
      paymentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
  })

  it('handles webhook without invoice metadata gracefully', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_orphan',
      payment_intent: 'pi_test_orphan',
      amount_total: 5000,
      // No metadata
    }

    const paymentRecord = buildPaymentRecord(session, 50)

    // Should return null - no invoice to associate
    expect(paymentRecord).toBeNull()
  })
})
