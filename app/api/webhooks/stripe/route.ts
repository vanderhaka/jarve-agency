import { createClient } from '@/utils/supabase/server'
import { verifyWebhookSignature, getPaymentIntent } from '@/lib/integrations/stripe/client'
import { xeroApiCall } from '@/lib/integrations/xero/client'
import { notifyInvoicePaid } from '@/lib/notifications/actions'
import { NextResponse } from 'next/server'

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for payment processing
 */
export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Verify webhook signature
  const event = verifyWebhookSignature(payload, signature)
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id: string
          payment_intent: string
          metadata?: { invoice_id?: string }
          amount_total?: number
        }

        const invoiceId = session.metadata?.invoice_id
        if (!invoiceId) {
          console.warn('Stripe checkout completed without invoice_id', { sessionId: session.id })
          return NextResponse.json({ received: true })
        }

        // Get the invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('*, client:clients(name, xero_contact_id)')
          .eq('id', invoiceId)
          .single()

        if (invoiceError || !invoice) {
          console.error('Invoice not found for Stripe payment', { invoiceId })
          return NextResponse.json({ received: true })
        }

        const paymentAmount = session.amount_total ? session.amount_total / 100 : invoice.total
        const paymentDate = new Date().toISOString().split('T')[0]

        // Record the payment locally
        const { error: paymentError } = await supabase.from('payments').insert({
          invoice_id: invoiceId,
          amount: paymentAmount,
          payment_date: paymentDate,
          method: 'stripe',
          reference: session.payment_intent,
          stripe_payment_intent_id: session.payment_intent,
        })

        if (paymentError) {
          console.error('Failed to record Stripe payment', { error: paymentError })
        }

        // Update invoice status
        await supabase
          .from('invoices')
          .update({
            paid_at: new Date().toISOString(),
            xero_status: 'PAID',
            stripe_payment_intent_id: session.payment_intent,
            stripe_checkout_session_id: session.id,
          })
          .eq('id', invoiceId)

        // Post payment to Xero if connected and invoice has xero_invoice_id
        if (invoice.xero_invoice_id) {
          await postPaymentToXero(invoice.xero_invoice_id, paymentAmount, paymentDate)
        }

        // Create notification for invoice paid
        // Get the project owner for the notification
        const { data: project } = await supabase
          .from('agency_projects')
          .select('owner_id')
          .eq('client_id', invoice.client_id)
          .single()

        if (project?.owner_id) {
          await notifyInvoicePaid(
            invoiceId,
            invoice.invoice_number || `INV-${invoiceId.slice(0, 8)}`,
            (invoice.client as { name: string })?.name || 'Unknown Client',
            paymentAmount,
            project.owner_id
          )
        }

        console.info('Stripe payment processed', {
          invoiceId,
          amount: paymentAmount,
          paymentIntent: session.payment_intent,
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as {
          id: string
          metadata?: { invoice_id?: string }
          last_payment_error?: { message?: string }
        }

        const invoiceId = paymentIntent.metadata?.invoice_id
        if (invoiceId) {
          console.warn('Stripe payment failed', {
            invoiceId,
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
          })
        }

        break
      }

      default:
        console.info('Unhandled Stripe event', { type: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error', { error, eventType: event.type })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Post a payment to Xero for the invoice
 */
async function postPaymentToXero(
  xeroInvoiceId: string,
  amount: number,
  paymentDate: string
): Promise<boolean> {
  try {
    // Get the first bank account from Xero
    const accountsResult = await xeroApiCall<{
      Accounts: Array<{ AccountID: string; Name: string; Type: string; Status: string }>
    }>('/Accounts?where=Type=="BANK"&&Status=="ACTIVE"')

    if (!accountsResult.success || !accountsResult.data?.Accounts?.length) {
      console.warn('No active bank account found in Xero')
      return false
    }

    const bankAccount = accountsResult.data.Accounts[0]

    // Post the payment
    const paymentResult = await xeroApiCall('/Payments', {
      method: 'POST',
      body: {
        Payments: [
          {
            Invoice: { InvoiceID: xeroInvoiceId },
            Account: { AccountID: bankAccount.AccountID },
            Amount: amount,
            Date: paymentDate,
            Reference: 'Stripe payment',
          },
        ],
      },
    })

    if (!paymentResult.success) {
      console.error('Failed to post payment to Xero', { error: paymentResult.error })
      return false
    }

    console.info('Payment posted to Xero', { xeroInvoiceId, amount })
    return true
  } catch (error) {
    console.error('Error posting payment to Xero', { error })
    return false
  }
}
