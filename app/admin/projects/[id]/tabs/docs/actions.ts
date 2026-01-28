'use server'

import { createClient } from '@/utils/supabase/server'

export interface ContractDoc {
  id: string
  title: string
  doc_type: string
  file_path: string | null
  created_at: string
  signed_at: string | null
}

export async function getProjectDocs(projectId: string): Promise<{
  success: boolean
  docs: ContractDoc[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_docs')
    .select('id, title, doc_type, file_path, created_at, signed_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching project docs:', error)
    return { success: false, docs: [], error: error.message }
  }

  return { success: true, docs: data ?? [] }
}

export async function getDocSignedUrl(docId: string): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const supabase = await createClient()

  // First get the doc to find the file path
  const { data: doc, error: docError } = await supabase
    .from('contract_docs')
    .select('file_path')
    .eq('id', docId)
    .single()

  if (docError || !doc?.file_path) {
    return { success: false, error: 'Document not found' }
  }

  // Generate signed URL
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('contracts')
    .createSignedUrl(doc.file_path, 3600) // 1 hour expiry

  if (urlError || !signedUrl?.signedUrl) {
    return { success: false, error: 'Could not generate download link' }
  }

  return { success: true, url: signedUrl.signedUrl }
}
