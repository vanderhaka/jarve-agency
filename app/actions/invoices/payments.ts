'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { postPaymentToXero } from './xero-sync'

/**
 * Mark an invoice as paid manually
 */
export async function markInvoicePaid(
  invoiceId: string,
  amount?: number,
  paymentDate?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, xero_invoice_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    const paymentAmount = amount ?? invoice.total
    const date = paymentDate || new Date().toISOString().split('T')[0]

    // Record the payment locally
    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      amount: paymentAmount,
      payment_date: date,
      method: 'manual',
      recorded_by: user.id,
    })

    if (paymentError) {
      console.error('Failed to record payment', { error: paymentError })
      return { success: false, error: 'Failed to record payment' }
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        paid_at: new Date().toISOString(),
        xero_status: 'PAID',
      })
      .eq('id', invoiceId)

    // Post payment to Xero if connected
    if (invoice.xero_invoice_id) {
      await postPaymentToXero(invoice.xero_invoice_id, paymentAmount, date)
    }

    revalidatePath('/app/projects')
    revalidatePath('/admin/invoices')

    return { success: true }
  } catch (error) {
    console.error('Mark invoice paid error', { error })
    return { success: false, error: 'Failed to mark as paid' }
  }
}
