'use server'

import { createClient } from '@/utils/supabase/server'
import { getXeroInvoicePdf } from '@/lib/integrations/xero/client'
import {
  generatePdfStoragePath,
  buildContractDocEntry,
  isValidPdfBuffer,
} from '@/lib/invoices/pdf-sync-helpers'

/**
 * Sync invoice PDF from Xero and store in contract_docs
 * INTERNAL: Called from syncInvoiceStatus after auth check
 * Not exported from index.ts - use syncInvoiceStatus instead
 * Has own auth check for defense-in-depth
 */
export async function syncInvoicePdfInternal(
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

  // Defense-in-depth: verify auth even for internal calls
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('Unauthorized syncInvoicePdfInternal call')
    return false
  }

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
