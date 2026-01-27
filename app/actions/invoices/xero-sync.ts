'use server'

import { createClient } from '@/utils/supabase/server'
import {
  createXeroInvoice,
  getXeroInvoice,
  xeroApiCall,
  XeroInvoice,
} from '@/lib/integrations/xero/client'
import { shouldSyncPdf } from '@/lib/invoices/pdf-sync-helpers'
import { syncInvoicePdfInternal } from './pdf'

// ============================================================
// Internal Helpers (not exported from index.ts)
// These have 'export' for module use but aren't meant for client calls.
// Auth is checked in the public functions that call them.
// ============================================================

/**
 * Create or get a Xero contact for a client
 * INTERNAL: Called from syncInvoiceToXero after auth check
 * Has own auth check for defense-in-depth
 */
export async function createOrGetXeroContact(client: {
  name: string
  email: string | null
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  // Defense-in-depth: verify auth even for internal calls
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // First check if contact exists by name
  const searchResult = await xeroApiCall<{
    Contacts: Array<{ ContactID: string; Name: string }>
  }>(`/Contacts?where=Name=="${encodeURIComponent(client.name)}"`)

  if (searchResult.success && searchResult.data?.Contacts?.length) {
    return { success: true, contactId: searchResult.data.Contacts[0].ContactID }
  }

  // Create new contact
  const createResult = await xeroApiCall<{
    Contacts: Array<{ ContactID: string }>
  }>('/Contacts', {
    method: 'POST',
    body: {
      Contacts: [
        {
          Name: client.name,
          EmailAddress: client.email,
        },
      ],
    },
  })

  if (!createResult.success || !createResult.data?.Contacts?.[0]?.ContactID) {
    return { success: false, error: 'Failed to create Xero contact' }
  }

  return { success: true, contactId: createResult.data.Contacts[0].ContactID }
}

/**
 * Post a payment to Xero
 * INTERNAL: Called from markInvoicePaid after auth check
 * Has own auth check for defense-in-depth
 */
export async function postPaymentToXero(
  xeroInvoiceId: string,
  amount: number,
  paymentDate: string
): Promise<boolean> {
  // Defense-in-depth: verify auth even for internal calls
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('Unauthorized postPaymentToXero call')
    return false
  }

  try {
    // Get the first active bank account
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
            Reference: 'Manual payment',
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

// ============================================================
// Public Server Actions (with authentication)
// ============================================================

/**
 * Sync an invoice to Xero as a Draft
 */
export async function syncInvoiceToXero(
  invoiceId: string
): Promise<{ success: boolean; xeroInvoiceId?: string; error?: string }> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Get the invoice with client info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients(id, name, email, xero_contact_id),
        line_items:invoice_line_items(*)
      `
      )
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (!invoice.client) {
      return { success: false, error: 'Invoice has no client' }
    }

    // Ensure client has a Xero contact
    let xeroContactId = invoice.client.xero_contact_id
    if (!xeroContactId) {
      const contactResult = await createOrGetXeroContact({
        name: invoice.client.name,
        email: invoice.client.email,
      })

      if (!contactResult.success) {
        return { success: false, error: 'Failed to create Xero contact' }
      }

      xeroContactId = contactResult.contactId!

      // Update client with Xero contact ID
      await supabase
        .from('clients')
        .update({ xero_contact_id: xeroContactId })
        .eq('id', invoice.client.id)
    }

    // Build Xero invoice
    const xeroInvoice: XeroInvoice = {
      Type: 'ACCREC',
      Contact: {
        ContactID: xeroContactId,
        Name: invoice.client.name,
      },
      DateString: invoice.issue_date,
      DueDateString: invoice.due_date,
      Status: 'DRAFT',
      LineAmountTypes: 'Exclusive', // GST exclusive
      LineItems: (invoice.line_items || []).map((item: {
        description: string
        quantity: number
        unit_price: number
      }) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unit_price,
        AccountCode: '200', // Sales account - adjust as needed
        TaxType: 'OUTPUT', // GST on Income
      })),
      Reference: invoice.invoice_number,
    }

    const result = await createXeroInvoice(xeroInvoice)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Update local invoice with Xero ID
    await supabase
      .from('invoices')
      .update({
        xero_invoice_id: result.invoiceId,
        invoice_number: result.invoiceNumber || invoice.invoice_number,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    return { success: true, xeroInvoiceId: result.invoiceId }
  } catch (error) {
    console.error('Sync invoice to Xero error', { error })
    return { success: false, error: 'Failed to sync to Xero' }
  }
}

/**
 * Sync invoice status from Xero
 * Also syncs PDF and creates contract_docs entry if status allows
 */
export async function syncInvoiceStatus(
  invoiceId: string
): Promise<{ success: boolean; status?: string; pdfSynced?: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('xero_invoice_id, invoice_number, client_id, project_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice?.xero_invoice_id) {
      return { success: false, error: 'Invoice not synced to Xero' }
    }

    const xeroInvoice = await getXeroInvoice(invoice.xero_invoice_id)
    if (!xeroInvoice) {
      return { success: false, error: 'Failed to fetch from Xero' }
    }

    // Update local invoice
    const updates: Record<string, unknown> = {
      xero_status: xeroInvoice.Status,
      last_synced_at: new Date().toISOString(),
    }

    if (xeroInvoice.Status === 'PAID' && xeroInvoice.AmountPaid) {
      updates.paid_at = new Date().toISOString()
    }

    await supabase.from('invoices').update(updates).eq('id', invoiceId)

    // Sync PDF if status allows (not DRAFT)
    let pdfSynced = false
    if (shouldSyncPdf(xeroInvoice.Status)) {
      pdfSynced = await syncInvoicePdfInternal(invoiceId, invoice.xero_invoice_id, {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        clientId: invoice.client_id,
        projectId: invoice.project_id,
      })
    }

    return { success: true, status: xeroInvoice.Status, pdfSynced }
  } catch (error) {
    console.error('Sync invoice status error', { error })
    return { success: false, error: 'Failed to sync status' }
  }
}
