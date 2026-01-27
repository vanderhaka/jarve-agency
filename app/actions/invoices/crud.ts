'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateInvoicePayload, InvoiceWithDetails } from './types'
import { mapInvoiceToDetails } from './helpers'
import { syncInvoiceToXero } from './xero-sync'

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

    revalidatePath('/app/projects')
    revalidatePath('/admin/invoices')

    return { success: true, invoiceId: invoice.id }
  } catch (error) {
    console.error('Create invoice error', { error })
    return { success: false, error: 'Failed to create invoice' }
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
