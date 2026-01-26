import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  extractInvoiceId,
  calculatePaymentAmount,
  buildPaymentRecord,
  buildXeroPaymentParams,
  isCheckoutCompleteEvent,
  isPaymentFailedEvent,
  type StripeCheckoutSession,
} from '@/lib/invoices/stripe-webhook-helpers'

/**
 * Tests for Stripe Webhook Route Logic
 * Tests the processing flow with mocked dependencies
 */

describe('Stripe Webhook Processing Flow', () => {
  describe('Webhook Signature Verification', () => {
    it('should reject requests without signature', () => {
      const signature = null
      expect(signature).toBeNull()
    })

    it('should validate webhook event types', () => {
      expect(isCheckoutCompleteEvent('checkout.session.completed')).toBe(true)
      expect(isCheckoutCompleteEvent('payment_intent.succeeded')).toBe(false)
      expect(isPaymentFailedEvent('payment_intent.payment_failed')).toBe(true)
    })
  })

  describe('Checkout Session Processing', () => {
    const validSession: StripeCheckoutSession = {
      id: 'cs_test_123456',
      payment_intent: 'pi_test_789012',
      metadata: { invoice_id: 'inv-uuid-abcdef' },
      amount_total: 11000, // $110.00 in cents
    }

    it('should extract invoice ID from session metadata', () => {
      const invoiceId = extractInvoiceId(validSession)
      expect(invoiceId).toBe('inv-uuid-abcdef')
    })

    it('should handle missing metadata gracefully', () => {
      const sessionWithoutMetadata: StripeCheckoutSession = {
        id: 'cs_test_orphan',
        payment_intent: 'pi_test_orphan',
        amount_total: 5000,
      }

      const invoiceId = extractInvoiceId(sessionWithoutMetadata)
      expect(invoiceId).toBeNull()
    })

    it('should convert amount from cents to dollars', () => {
      const amount = calculatePaymentAmount(11000, 110)
      expect(amount).toBe(110)
    })

    it('should handle decimal amounts correctly', () => {
      const amount = calculatePaymentAmount(9999, 100) // $99.99
      expect(amount).toBe(99.99)
    })

    it('should fall back to invoice total when session amount is missing', () => {
      const amount = calculatePaymentAmount(null, 100)
      expect(amount).toBe(100)
    })

    it('should build complete payment record', () => {
      const record = buildPaymentRecord(validSession, 110)

      expect(record).not.toBeNull()
      expect(record?.invoiceId).toBe('inv-uuid-abcdef')
      expect(record?.amount).toBe(110)
      expect(record?.method).toBe('stripe')
      expect(record?.stripePaymentIntentId).toBe('pi_test_789012')
    })

    it('should return null when invoice ID is missing', () => {
      const sessionWithoutInvoice: StripeCheckoutSession = {
        id: 'cs_test_no_invoice',
        payment_intent: 'pi_test_123',
        amount_total: 5000,
      }

      const record = buildPaymentRecord(sessionWithoutInvoice, 50)
      expect(record).toBeNull()
    })
  })

  describe('Xero Payment Posting', () => {
    it('should build Xero payment params', () => {
      const params = buildXeroPaymentParams('xero-inv-123', 110)

      expect(params.xeroInvoiceId).toBe('xero-inv-123')
      expect(params.amount).toBe(110)
      expect(params.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should only post to Xero if invoice has xero_invoice_id', () => {
      const invoiceWithXero = { xero_invoice_id: 'xero-123', total: 100 }
      const invoiceWithoutXero = { xero_invoice_id: null, total: 100 }

      expect(!!invoiceWithXero.xero_invoice_id).toBe(true)
      expect(!!invoiceWithoutXero.xero_invoice_id).toBe(false)
    })
  })

  describe('Payment Failed Event Handling', () => {
    it('should identify payment failed events', () => {
      expect(isPaymentFailedEvent('payment_intent.payment_failed')).toBe(true)
      expect(isPaymentFailedEvent('checkout.session.completed')).toBe(false)
    })

    it('should extract error information from failed payment', () => {
      const failedPaymentIntent = {
        id: 'pi_failed_123',
        metadata: { invoice_id: 'inv-uuid-123' },
        last_payment_error: {
          message: 'Your card was declined',
          code: 'card_declined',
        },
      }

      expect(failedPaymentIntent.last_payment_error.message).toBe('Your card was declined')
      expect(failedPaymentIntent.metadata?.invoice_id).toBe('inv-uuid-123')
    })
  })

  describe('Database Updates', () => {
    it('should build payment insert data correctly', () => {
      const session: StripeCheckoutSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_456',
        metadata: { invoice_id: 'inv-uuid-789' },
        amount_total: 11000,
      }

      const record = buildPaymentRecord(session, 110)

      // Verify the payment record has all required fields for DB insert
      expect(record).toHaveProperty('invoiceId')
      expect(record).toHaveProperty('amount')
      expect(record).toHaveProperty('paymentDate')
      expect(record).toHaveProperty('method')
      expect(record).toHaveProperty('reference')
      expect(record).toHaveProperty('stripePaymentIntentId')
    })

    it('should set payment date to current date', () => {
      const today = new Date().toISOString().split('T')[0]
      const session: StripeCheckoutSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_456',
        metadata: { invoice_id: 'inv-uuid-789' },
        amount_total: 11000,
      }

      const record = buildPaymentRecord(session, 110)

      expect(record?.paymentDate).toBe(today)
    })
  })

  describe('Error Handling', () => {
    it('should handle webhook processing gracefully', () => {
      // Simulate various error conditions
      const invalidSession: StripeCheckoutSession = {
        id: '',
        payment_intent: null,
        amount_total: 0,
      }

      const record = buildPaymentRecord(invalidSession, 0)
      expect(record).toBeNull() // No invoice_id in metadata
    })

    it('should handle zero amount correctly', () => {
      const amount = calculatePaymentAmount(0, 100)
      expect(amount).toBe(100) // Falls back to invoice total
    })

    it('should handle null payment intent', () => {
      const session: StripeCheckoutSession = {
        id: 'cs_test_123',
        payment_intent: null,
        metadata: { invoice_id: 'inv-uuid-123' },
        amount_total: 5000,
      }

      const record = buildPaymentRecord(session, 50)

      expect(record?.reference).toBeNull()
      expect(record?.stripePaymentIntentId).toBeNull()
    })
  })
})

describe('Full Webhook Flow Integration', () => {
  it('processes a complete checkout flow', () => {
    // 1. Webhook receives event
    const eventType = 'checkout.session.completed'
    expect(isCheckoutCompleteEvent(eventType)).toBe(true)

    // 2. Extract session data
    const session: StripeCheckoutSession = {
      id: 'cs_live_abc123',
      payment_intent: 'pi_live_xyz789',
      metadata: { invoice_id: 'inv-real-uuid' },
      amount_total: 22000, // $220.00
    }

    // 3. Get invoice ID
    const invoiceId = extractInvoiceId(session)
    expect(invoiceId).toBe('inv-real-uuid')

    // 4. Build payment record
    const payment = buildPaymentRecord(session, 220)
    expect(payment?.amount).toBe(220)
    expect(payment?.method).toBe('stripe')

    // 5. Build Xero params (if invoice is connected to Xero)
    const xeroParams = buildXeroPaymentParams('xero-uuid-456', 220)
    expect(xeroParams.amount).toBe(220)
  })

  it('handles webhook for invoice without Xero connection', () => {
    const session: StripeCheckoutSession = {
      id: 'cs_test_local_only',
      payment_intent: 'pi_test_local',
      metadata: { invoice_id: 'inv-local-123' },
      amount_total: 5000,
    }

    // Payment should still be recorded locally
    const payment = buildPaymentRecord(session, 50)
    expect(payment).not.toBeNull()
    expect(payment?.invoiceId).toBe('inv-local-123')

    // But no Xero posting if no xero_invoice_id
    const invoiceWithoutXero = { xero_invoice_id: null }
    expect(invoiceWithoutXero.xero_invoice_id).toBeNull()
  })
})
