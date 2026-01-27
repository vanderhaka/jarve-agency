'use server'

import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/utils/supabase/server'
import { SowPdf, type SowPdfProps } from './sow-pdf'
import React from 'react'

interface GenerateSowPdfParams {
  proposalId: string
  versionId: string
  projectId: string
}

/**
 * Generate SOW PDF for a signed proposal
 * Called async after proposal signing completes
 */
export async function generateSowPdf(
  params: GenerateSowPdfParams
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const supabase = await createClient()

  try {
    // Fetch all data needed for the PDF
    const [
      { data: proposal },
      { data: version },
      { data: signature },
      { data: project },
      { data: agency },
    ] = await Promise.all([
      supabase
        .from('proposals')
        .select('id, title, client_id, clients(name, email, company)')
        .eq('id', params.proposalId)
        .single(),
      supabase
        .from('proposal_versions')
        .select('id, version, content, created_at')
        .eq('id', params.versionId)
        .single(),
      supabase
        .from('proposal_signatures')
        .select('signer_name, signer_email, signed_at, signature_svg, ip_address')
        .eq('proposal_id', params.proposalId)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('agency_projects')
        .select('id, name')
        .eq('id', params.projectId)
        .single(),
      supabase.from('agency_settings').select('legal_name, trade_name, abn').single(),
    ])

    if (!proposal || !version || !signature || !project) {
      console.error('[generateSowPdf] Missing required data', {
        hasProposal: !!proposal,
        hasVersion: !!version,
        hasSignature: !!signature,
        hasProject: !!project,
      })
      return { success: false, error: 'Missing required data for PDF generation' }
    }

    // Extract client from joined data
    const clientData = Array.isArray(proposal.clients)
      ? proposal.clients[0]
      : proposal.clients

    // Build props for PDF component
    const pdfProps: SowPdfProps = {
      proposalTitle: proposal.title,
      version: version.version,
      content: version.content as SowPdfProps['content'],
      signature: {
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        signedAt: signature.signed_at,
        signatureSvg: signature.signature_svg,
        ipAddress: signature.ip_address || undefined,
      },
      agency: {
        name: agency?.trade_name || agency?.legal_name || 'Agency',
        abn: agency?.abn || undefined,
      },
      client: {
        name: clientData?.name || 'Client',
        email: clientData?.email || undefined,
        company: clientData?.company || undefined,
      },
      project: {
        name: project.name,
      },
      createdAt: version.created_at,
    }

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(React.createElement(SowPdf, pdfProps) as any)

    // Generate storage path
    const storagePath = `projects/${params.projectId}/sow-v${version.version}-${params.proposalId}.pdf`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('contract-docs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[generateSowPdf] Upload failed', { error: uploadError })
      return { success: false, error: 'Failed to upload PDF' }
    }

    // Update contract_docs entry with file_path
    const { error: updateError } = await supabase
      .from('contract_docs')
      .update({ file_path: storagePath })
      .eq('source_table', 'proposals')
      .eq('source_id', params.proposalId)
      .eq('doc_type', 'sow')

    if (updateError) {
      console.error('[generateSowPdf] Failed to update contract_docs', { error: updateError })
      return { success: false, error: 'Failed to update document record' }
    }

    console.info('[generateSowPdf] PDF generated successfully', { storagePath })
    return { success: true, filePath: storagePath }
  } catch (error) {
    console.error('[generateSowPdf] Unexpected error', { error })
    return { success: false, error: 'PDF generation failed' }
  }
}

/**
 * Regenerate PDF for an existing contract_docs entry
 * Used for backfilling or fixing failed generations
 */
export async function regenerateSowPdf(
  contractDocId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the contract doc to find the source proposal
  const { data: doc, error: docError } = await supabase
    .from('contract_docs')
    .select('source_id, source_table, project_id')
    .eq('id', contractDocId)
    .eq('doc_type', 'sow')
    .single()

  if (docError || !doc || doc.source_table !== 'proposals') {
    return { success: false, error: 'Contract doc not found or not a SOW' }
  }

  // Get the signed version for this proposal
  const { data: signature } = await supabase
    .from('proposal_signatures')
    .select('proposal_version_id')
    .eq('proposal_id', doc.source_id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .single()

  if (!signature?.proposal_version_id) {
    return { success: false, error: 'No signature found for proposal' }
  }

  return generateSowPdf({
    proposalId: doc.source_id!,
    versionId: signature.proposal_version_id,
    projectId: doc.project_id!,
  })
}
