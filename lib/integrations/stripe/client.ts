/**
 * Stripe Client
 * Handles Stripe Checkout sessions and payment processing
 *
 * Adapted from jarve-website for jarve-agency CRM
 */

import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Initialize Stripe client
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!stripe
}

/**
 * Create a Stripe Checkout session for invoice payment
 */
export async function createCheckoutSession(params: {
  invoiceId: string
  amount: number // in cents
  currency?: string
  customerEmail?: string
  description: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
  if (!stripe) {
    console.error('Stripe not configured')
    return { success: false, error: 'Payment system not configured' }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency || 'aud',
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      payment_intent_data: {
        metadata: {
          invoice_id: params.invoiceId,
          ...params.metadata,
        },
      },
      metadata: {
        invoice_id: params.invoiceId,
        ...params.metadata,
      },
    })

    console.info('Stripe checkout session created', {
      sessionId: session.id,
      invoiceId: params.invoiceId,
    })

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
    }
  } catch (error) {
    // Log full error details for debugging
    console.error('Failed to create Stripe checkout session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      invoiceId: params.invoiceId,
      amount: params.amount,
      currency: params.currency,
      // Log Stripe-specific error details if available
      stripeCode: (error as { code?: string })?.code,
      stripeType: (error as { type?: string })?.type,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment session',
    }
  }
}

/**
 * Create a Stripe Payment Link for recurring use
 */
export async function createPaymentLink(params: {
  invoiceId: string
  amount: number // in cents
  currency?: string
  description: string
  metadata?: Record<string, string>
}): Promise<{ success: boolean; paymentLinkId?: string; url?: string; error?: string }> {
  if (!stripe) {
    console.error('Stripe not configured')
    return { success: false, error: 'Payment system not configured' }
  }

  try {
    // First create a price
    const price = await stripe.prices.create({
      currency: params.currency || 'aud',
      unit_amount: params.amount,
      product_data: {
        name: params.description,
      },
    })

    // Create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: params.invoiceId,
        ...params.metadata,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?invoice=${params.invoiceId}`,
        },
      },
    })

    console.info('Stripe payment link created', {
      paymentLinkId: paymentLink.id,
      invoiceId: params.invoiceId,
    })

    return {
      success: true,
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
    }
  } catch (error) {
    console.error('Failed to create Stripe payment link', {
      error: error instanceof Error ? error.message : 'Unknown error',
      invoiceId: params.invoiceId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment link',
    }
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null

  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })
  } catch (error) {
    console.error('Failed to retrieve checkout session', { sessionId, error })
    return null
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret not configured')
    return null
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Failed to verify Stripe webhook signature', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) return null

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Failed to retrieve payment intent', { paymentIntentId, error })
    return null
  }
}

/**
 * Issue a refund
 */
export async function createRefund(params: {
  paymentIntentId: string
  amount?: number // in cents, omit for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Payment system not configured' }
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount,
      reason: params.reason,
    })

    console.info('Stripe refund created', {
      refundId: refund.id,
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
    })

    return { success: true, refundId: refund.id }
  } catch (error) {
    console.error('Failed to create refund', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentIntentId: params.paymentIntentId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund',
    }
  }
}

export { stripe }
