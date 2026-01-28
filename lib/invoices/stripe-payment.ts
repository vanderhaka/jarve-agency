import type { SupabaseClient } from '@supabase/supabase-js'

export interface StripePaymentRecordParams {
  invoiceId: string
  amount: number
  paymentDate: string
  paymentIntentId: string | null
  reference?: string | null
}

export async function resolveInvoiceIdForStripe(params: {
  supabase: SupabaseClient
  invoiceId?: string | null
  checkoutSessionId?: string | null
  paymentIntentId?: string | null
}): Promise<string | null> {
  const { supabase, invoiceId, checkoutSessionId, paymentIntentId } = params

  if (invoiceId) return invoiceId

  if (checkoutSessionId) {
    const { data } = await supabase
      .from('invoices')
      .select('id')
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .maybeSingle()

    if (data?.id) return data.id
  }

  if (paymentIntentId) {
    const { data } = await supabase
      .from('invoices')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (data?.id) return data.id
  }

  return null
}

export async function ensureStripePaymentRecord(
  supabase: SupabaseClient,
  params: StripePaymentRecordParams
): Promise<{ inserted: boolean; duplicate: boolean }> {
  const { invoiceId, amount, paymentDate, paymentIntentId, reference } = params

  if (!paymentIntentId) {
    console.warn('Stripe payment intent missing; skipping payment insert', { invoiceId })
    return { inserted: false, duplicate: false }
  }

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (existing?.id) {
    return { inserted: false, duplicate: true }
  }

  const { error } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    amount,
    payment_date: paymentDate,
    method: 'stripe',
    reference: reference ?? paymentIntentId,
    stripe_payment_intent_id: paymentIntentId,
  })

  if (error) {
    if (error.code === '23505') {
      return { inserted: false, duplicate: true }
    }
    throw error
  }

  return { inserted: true, duplicate: false }
}
