'use server'

import { createClient } from '@/utils/supabase/server'
import { regenerateSowPdf } from '@/lib/pdf'

/**
 * Regenerate all PDFs for contract_docs with missing file_path
 * Admin action - requires authentication
 */
export async function regenerateAllPendingPdfs(): Promise<{
  success: boolean
  results: { id: string; docType: string; success: boolean; error?: string }[]
}> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, results: [] }
  }

  // Get all contract_docs with missing file_path
  const { data: pendingDocs, error } = await supabase
    .from('contract_docs')
    .select('id, doc_type, source_table, source_id')
    .or('file_path.is.null,file_path.eq.')

  if (error || !pendingDocs) {
    console.error('[regenerateAllPendingPdfs] Failed to fetch docs', { error })
    return { success: false, results: [] }
  }

  const results: { id: string; docType: string; success: boolean; error?: string }[] = []

  for (const doc of pendingDocs) {
    if (doc.doc_type === 'sow' && doc.source_table === 'proposals') {
      const result = await regenerateSowPdf(doc.id)
      results.push({
        id: doc.id,
        docType: doc.doc_type,
        success: result.success,
        error: result.error,
      })
    } else if (doc.doc_type === 'invoice') {
      // Invoice PDFs come from Xero - skip for now, they'll be synced when admin clicks sync
      results.push({
        id: doc.id,
        docType: doc.doc_type,
        success: false,
        error: 'Invoice PDFs sync from Xero - use invoice sync action',
      })
    } else {
      results.push({
        id: doc.id,
        docType: doc.doc_type,
        success: false,
        error: `Unknown doc_type: ${doc.doc_type}`,
      })
    }
  }

  const allSucceeded = results.filter((r) => r.docType === 'sow').every((r) => r.success)
  return { success: allSucceeded, results }
}

/**
 * Regenerate PDF for a single contract_doc
 * Admin action - requires authentication
 */
export async function regeneratePdf(
  contractDocId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get the doc
  const { data: doc, error } = await supabase
    .from('contract_docs')
    .select('doc_type, source_table')
    .eq('id', contractDocId)
    .single()

  if (error || !doc) {
    return { success: false, error: 'Document not found' }
  }

  if (doc.doc_type === 'sow' && doc.source_table === 'proposals') {
    return regenerateSowPdf(contractDocId)
  } else if (doc.doc_type === 'invoice') {
    return { success: false, error: 'Invoice PDFs sync from Xero - use invoice sync action' }
  }

  return { success: false, error: `Cannot regenerate PDF for doc_type: ${doc.doc_type}` }
}
