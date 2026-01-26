'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createXeroInvoice,
  getXeroInvoice,
  getXeroInvoicePdf,
  xeroApiCall,
  postPaymentToXero,
  XeroInvoice,
} from '@/lib/integrations/xero/client'
import {
  generatePdfStoragePath,
  buildContractDocEntry,
  shouldSyncPdf,
  isValidPdfBuffer,
} from '@/lib/invoices/pdf-sync-helpers'

// ============================================================
// Types
// ============================================================

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface CreateInvoicePayload {
  clientId: string
  projectId?: string
  lineItems: InvoiceLineItem[]
  issueDate?: string
  dueDate?: string
  notes?: string
}

export interface InvoiceWithDetails {
  id: string
  clientId: string | null
  projectId: string | null
  xeroInvoiceId: string | null
  xeroStatus: string | null
  invoiceNumber: string | null
  currency: string
  subtotal: number | null
  gstRate: number
  gstAmount: number | null
  total: number | null
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  paymentLinkUrl: string | null
  lastSyncedAt: string | null
  createdAt: string
  client?: {
    id: string
    name: string
    email: string | null
    xeroContactId: string | null
  }
  project?: {
    id: string
    name: string
  }
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    sortOrder: number
  }>
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    method: string | null
    reference: string | null
  }>
}

// ============================================================
// Invoice Actions
// ============================================================

/**
 * Create a new invoice and optionally sync to Xero as Draft
 */
export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Get agency settings for invoice prefix and GST rate
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('invoice_prefix, gst_rate, default_currency, invoice_terms_days')
      .single()

    const gstRate = settings?.gst_rate ?? 0.1
    const currency = settings?.default_currency ?? 'AUD'
    const invoicePrefix = settings?.invoice_prefix ?? 'INV'
    const termsDays = settings?.invoice_terms_days ?? 14

    // Calculate totals
    const subtotal = payload.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const gstAmount = subtotal * gstRate
    const total = subtotal + gstAmount

    // Determine dates
    const issueDate = payload.issueDate || new Date().toISOString().split('T')[0]
    const dueDate =
      payload.dueDate ||
      new Date(new Date(issueDate).getTime() + termsDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    // Get next invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `${invoicePrefix}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
    const invoiceNumber = `${invoicePrefix}-${String(nextNumber).padStart(4, '0')}`

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: payload.clientId,
        project_id: payload.projectId || null,
        invoice_number: invoiceNumber,
        currency,
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total,
        issue_date: issueDate,
        due_date: dueDate,
        xero_status: 'DRAFT',
        created_by: user.id,
      })
      .select('id')
      .single()

    if (invoiceError || !invoice) {
      console.error('Failed to create invoice', { error: invoiceError })
      return { success: false, error: 'Failed to create invoice' }
    }

    // Create line items
    const lineItemsData = payload.lineItems.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      sort_order: index,
    }))

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData)

    if (lineItemsError) {
      console.error('Failed to create line items', { error: lineItemsError })
      // Invoice created but line items failed - log but don't fail
    }

    // Try to sync to Xero
    await syncInvoiceToXero(invoice.id)

    revalidatePath('/admin/projects')
    revalidatePath('/admin/invoices')

    return { success: true, invoiceId: invoice.id }
  } catch (error) {
    console.error('Create invoice error', { error })
    return { success: false, error: 'Failed to create invoice' }
  }
}

/**
 * Sync an invoice to Xero as a Draft
 */
export async function syncInvoiceToXero(
  invoiceId: string
): Promise<{ success: boolean; xeroInvoiceId?: string; error?: string }> {
  const supabase = await createClient()

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
      pdfSynced = await syncInvoicePdf(invoiceId, invoice.xero_invoice_id, {
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

/**
 * Sync invoice PDF from Xero and store in contract_docs
 */
async function syncInvoicePdf(
  invoiceId: string,
  xeroInvoiceId: string,
  params: {
    invoiceId: string
    invoiceNumber: string | null
    clientId: string | null
    projectId: string | null
  }
): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Check if we already have this PDF
    const { data: existingDoc } = await supabase
      .from('contract_docs')
      .select('id')
      .eq('source_table', 'invoices')
      .eq('source_id', invoiceId)
      .eq('doc_type', 'invoice')
      .maybeSingle()

    if (existingDoc) {
      // PDF already synced
      return true
    }

    // Fetch PDF from Xero
    const pdfBuffer = await getXeroInvoicePdf(xeroInvoiceId)
    if (!isValidPdfBuffer(pdfBuffer)) {
      console.warn('Invalid or empty PDF received from Xero', { invoiceId })
      return false
    }

    // Generate storage path and upload
    const storagePath = generatePdfStoragePath(params)
    const { error: uploadError } = await supabase.storage
      .from('contract-docs')
      .upload(storagePath, pdfBuffer!, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Failed to upload invoice PDF', { invoiceId, error: uploadError })
      return false
    }

    // Create contract_docs entry
    const docEntry = buildContractDocEntry(params, storagePath)
    const { error: docError } = await supabase.from('contract_docs').insert({
      client_id: docEntry.clientId,
      project_id: docEntry.projectId,
      doc_type: docEntry.docType,
      title: docEntry.title,
      file_path: docEntry.filePath,
      source_table: docEntry.sourceTable,
      source_id: docEntry.sourceId,
    })

    if (docError) {
      console.error('Failed to create contract_docs entry', { invoiceId, error: docError })
      return false
    }

    console.info('Invoice PDF synced successfully', { invoiceId, storagePath })
    return true
  } catch (error) {
    console.error('Error syncing invoice PDF', { invoiceId, error })
    return false
  }
}

/**
 * Get invoices for a project
 */
export async function getProjectInvoices(
  projectId: string
): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(id, name, email, xero_contact_id),
      project:agency_projects(id, name),
      line_items:invoice_line_items(*),
      payments(*)
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get project invoices', { error })
    return []
  }

  return (invoices || []).map(mapInvoiceToDetails)
}

/**
 * Get all invoices (for admin view)
 */
export async function getAllInvoices(): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(id, name, email, xero_contact_id),
      project:agency_projects(id, name),
      line_items:invoice_line_items(*),
      payments(*)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get all invoices', { error })
    return []
  }

  return (invoices || []).map(mapInvoiceToDetails)
}

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

    revalidatePath('/admin/projects')
    revalidatePath('/admin/invoices')

    return { success: true }
  } catch (error) {
    console.error('Mark invoice paid error', { error })
    return { success: false, error: 'Failed to mark as paid' }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create or get a Xero contact for a client
 */
async function createOrGetXeroContact(client: {
  name: string
  email: string | null
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
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
 * Map database invoice to InvoiceWithDetails type
 */
function mapInvoiceToDetails(invoice: Record<string, unknown>): InvoiceWithDetails {
  const client = invoice.client as Record<string, unknown> | null
  const project = invoice.project as Record<string, unknown> | null
  const lineItems = (invoice.line_items || []) as Array<Record<string, unknown>>
  const payments = (invoice.payments || []) as Array<Record<string, unknown>>

  return {
    id: invoice.id as string,
    clientId: invoice.client_id as string | null,
    projectId: invoice.project_id as string | null,
    xeroInvoiceId: invoice.xero_invoice_id as string | null,
    xeroStatus: invoice.xero_status as string | null,
    invoiceNumber: invoice.invoice_number as string | null,
    currency: invoice.currency as string,
    subtotal: invoice.subtotal as number | null,
    gstRate: invoice.gst_rate as number,
    gstAmount: invoice.gst_amount as number | null,
    total: invoice.total as number | null,
    issueDate: invoice.issue_date as string | null,
    dueDate: invoice.due_date as string | null,
    paidAt: invoice.paid_at as string | null,
    paymentLinkUrl: invoice.payment_link_url as string | null,
    lastSyncedAt: invoice.last_synced_at as string | null,
    createdAt: invoice.created_at as string,
    client: client
      ? {
          id: client.id as string,
          name: client.name as string,
          email: client.email as string | null,
          xeroContactId: client.xero_contact_id as string | null,
        }
      : undefined,
    project: project
      ? {
          id: project.id as string,
          name: project.name as string,
        }
      : undefined,
    lineItems: lineItems.map((item) => ({
      id: item.id as string,
      description: item.description as string,
      quantity: item.quantity as number,
      unitPrice: item.unit_price as number,
      amount: item.amount as number,
      sortOrder: item.sort_order as number,
    })),
    payments: payments.map((payment) => ({
      id: payment.id as string,
      amount: payment.amount as number,
      paymentDate: payment.payment_date as string,
      method: payment.method as string | null,
      reference: payment.reference as string | null,
    })),
  }
}
