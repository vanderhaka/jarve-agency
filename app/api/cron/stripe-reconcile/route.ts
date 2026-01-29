import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getCheckoutSession, getPaymentIntent } from '@/lib/integrations/stripe/client'
import { ensureStripePaymentRecord } from '@/lib/invoices/stripe-payment'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not set')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(
      'id, total, stripe_checkout_session_id, stripe_payment_intent_id, payment_status_updated_at, payment_status'
    )
    .eq('payment_status', 'processing')
    .or(`payment_status_updated_at.is.null,payment_status_updated_at.lt.${cutoff}`)
    .limit(50)

  if (error) {
    console.error('Stripe reconcile: failed to fetch invoices', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }

  let reconciled = 0
  let failed = 0

  for (const invoice of invoices || []) {
    try {
      let paymentIntentId: string | null = invoice.stripe_payment_intent_id
      let paymentAmount: number | null = null
      let paymentDate: string | null = null
      let paid = false
      let failedStatus: string | null = null

      if (invoice.stripe_checkout_session_id) {
        const session = await getCheckoutSession(invoice.stripe_checkout_session_id)
        if (session) {
          paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? paymentIntentId
          paymentAmount = session.amount_total ? session.amount_total / 100 : null
          paymentDate = session.created
            ? new Date(session.created * 1000).toISOString().split('T')[0]
            : null

          if (session.payment_status === 'paid') {
            paid = true
          } else if (session.status === 'expired') {
            failedStatus = session.status
          }
        }
      }

      if (!paid && invoice.stripe_payment_intent_id) {
        const intent = await getPaymentIntent(invoice.stripe_payment_intent_id)
        if (intent) {
          paymentIntentId = intent.id
          paymentAmount = intent.amount_received ? intent.amount_received / 100 : paymentAmount
          paymentDate = intent.created
            ? new Date(intent.created * 1000).toISOString().split('T')[0]
            : paymentDate

          if (intent.status === 'succeeded') {
            paid = true
          } else if (intent.status === 'canceled' || intent.status === 'requires_payment_method') {
            failedStatus = intent.status
          }
        }
      }

      if (paid) {
        const amount = paymentAmount ?? Number(invoice.total ?? 0)
        const date = paymentDate ?? new Date().toISOString().split('T')[0]

        await ensureStripePaymentRecord(supabase, {
          invoiceId: invoice.id,
          amount,
          paymentDate: date,
          paymentIntentId,
          reference: paymentIntentId,
        })

        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            payment_status_updated_at: new Date().toISOString(),
            last_payment_error: null,
            stripe_payment_intent_id: paymentIntentId,
            paid_at: new Date().toISOString(),
          })
          .eq('id', invoice.id)

        reconciled += 1
      } else if (failedStatus) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'failed',
            payment_status_updated_at: new Date().toISOString(),
            last_payment_error: `Stripe payment ${failedStatus}`,
          })
          .eq('id', invoice.id)
        failed += 1
      }
    } catch (error) {
      console.error('Stripe reconcile: failed to process invoice', { invoiceId: invoice.id, error })
      failed += 1
    }
  }

  return NextResponse.json({ processed: invoices?.length ?? 0, reconciled, failed })
}
