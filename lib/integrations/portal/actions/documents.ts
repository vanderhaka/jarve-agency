/**
 * Portal Documents
 * Contract document retrieval for the client portal
 */

'use server'

import { createAnonClient } from '@/utils/supabase/anon'
import type { ContractDoc } from '../types'
import { validateTokenForProject, validateTokenForClient } from './tokens'

/**
 * Get contract documents for a project (docs vault)
 */
export async function getContractDocs(
  token: string,
  projectId: string
): Promise<{ success: true; docs: ContractDoc[] } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Get project's client_id for MSA docs
    const { data: project } = await supabase
      .from('agency_projects')
      .select('client_id')
      .eq('id', projectId)
      .single()

    // Fetch contract docs for this project OR client-level MSAs
    const { data: docs, error } = await supabase
      .from('contract_docs')
      .select('*')
      .or(`project_id.eq.${projectId},and(client_id.eq.${project?.client_id},type.eq.msa)`)
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet (Stage 3)
      return { success: true, docs: [] }
    }

    return { success: true, docs: (docs || []) as ContractDoc[] }
  } catch (error) {
    console.error('Error getting contract docs:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get signed URL for a contract document
 */
export async function getContractDocSignedUrl(
  token: string,
  docId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Get the doc record
    const { data: doc, error: docError } = await supabase
      .from('contract_docs')
      .select('project_id, client_id, file_path')
      .eq('id', docId)
      .single()

    if (docError || !doc) {
      return { success: false, error: 'Document not found' }
    }

    // Validate token - need to check if user has access to this doc
    // For project-level docs, validate project access
    // For client-level MSAs, validate client access
    if (doc.project_id) {
      const validation = await validateTokenForProject(supabase, token, doc.project_id)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
    } else if (doc.client_id) {
      // For client-level documents (MSAs), validate client access
      const validation = await validateTokenForClient(supabase, token, doc.client_id)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
    } else {
      // Document has neither project_id nor client_id - deny access
      return { success: false, error: 'Access denied' }
    }

    // Generate signed URL (1 hour expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('contract-docs')
      .createSignedUrl(doc.file_path, 3600)

    if (urlError || !signedUrl) {
      return { success: false, error: 'Failed to generate download URL' }
    }

    return { success: true, url: signedUrl.signedUrl }
  } catch (error) {
    console.error('Error getting contract doc signed URL:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
