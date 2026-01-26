'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ============================================================
// Types
// ============================================================

export interface MSAContent {
  sections: {
    id: string
    title: string
    body: string
    order: number
  }[]
}

export interface CreateMSAInput {
  clientId: string
  title?: string
  content?: MSAContent
}

export interface SendMSAInput {
  clientUserId: string
}

export interface SignMSAInput {
  token: string
  signerName: string
  signerEmail: string
  signatureSvg: string
  ipAddress?: string
}

// ============================================================
// Create MSA (one per client)
// ============================================================

export async function createMSA(input: CreateMSAInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    return { success: false, message: 'Employee not found' }
  }

  // Check if client already has an MSA
  const { data: existingMSA } = await supabase
    .from('client_msas')
    .select('id, status')
    .eq('client_id', input.clientId)
    .single()

  if (existingMSA) {
    return {
      success: false,
      message: 'Client already has an MSA',
      existingMsaId: existingMSA.id,
      existingStatus: existingMSA.status
    }
  }

  // Verify client exists
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', input.clientId)
    .is('deleted_at', null)
    .single()

  if (clientError || !client) {
    return { success: false, message: 'Client not found' }
  }

  // Default MSA content
  const defaultContent: MSAContent = {
    sections: [
      {
        id: 'parties',
        title: '1. Parties',
        body: `This Master Service Agreement ("Agreement") is entered into between the Agency and ${client.name} ("Client").`,
        order: 1
      },
      {
        id: 'scope',
        title: '2. Scope of Services',
        body: 'The Agency agrees to provide professional services as outlined in individual Statements of Work (SOW) issued under this Agreement.',
        order: 2
      },
      {
        id: 'payment',
        title: '3. Payment Terms',
        body: 'Payment terms are as specified in each Statement of Work. Unless otherwise stated, a 50% deposit is required before work commences, with the balance due upon completion.',
        order: 3
      },
      {
        id: 'ip',
        title: '4. Intellectual Property',
        body: 'Upon full payment, the Client receives ownership of all deliverables created specifically for the Client. The Agency retains ownership of pre-existing materials, tools, and methodologies.',
        order: 4
      },
      {
        id: 'confidentiality',
        title: '5. Confidentiality',
        body: 'Both parties agree to maintain the confidentiality of proprietary information shared during the course of this Agreement.',
        order: 5
      },
      {
        id: 'termination',
        title: '6. Termination',
        body: 'Either party may terminate this Agreement with 30 days written notice. Outstanding payments for work completed remain due upon termination.',
        order: 6
      },
      {
        id: 'liability',
        title: '7. Limitation of Liability',
        body: 'The Agency\'s liability shall be limited to the total fees paid under the relevant Statement of Work.',
        order: 7
      },
      {
        id: 'governing-law',
        title: '8. Governing Law',
        body: 'This Agreement shall be governed by the laws of the State of South Australia, Australia.',
        order: 8
      }
    ]
  }

  try {
    const { data: msa, error: msaError } = await supabase
      .from('client_msas')
      .insert({
        client_id: input.clientId,
        title: input.title || 'Master Service Agreement',
        content: input.content || defaultContent,
        status: 'draft',
        created_by: employee.id
      })
      .select('id')
      .single()

    if (msaError || !msa) {
      console.error('[createMSA] Error:', msaError)
      return { success: false, message: 'Failed to create MSA' }
    }

    revalidatePath(`/admin/clients/${input.clientId}`)
    revalidatePath('/admin/proposals')

    return {
      success: true,
      message: 'MSA created successfully',
      msaId: msa.id
    }
  } catch (error) {
    console.error('[createMSA] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Update MSA
// ============================================================

export async function updateMSA(msaId: string, content: MSAContent) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get MSA
  const { data: msa, error: msaError } = await supabase
    .from('client_msas')
    .select('id, status')
    .eq('id', msaId)
    .single()

  if (msaError || !msa) {
    return { success: false, message: 'MSA not found' }
  }

  if (msa.status === 'signed') {
    return { success: false, message: 'Cannot edit a signed MSA' }
  }

  const { error: updateError } = await supabase
    .from('client_msas')
    .update({ content })
    .eq('id', msaId)

  if (updateError) {
    console.error('[updateMSA] Error:', updateError)
    return { success: false, message: 'Failed to update MSA' }
  }

  revalidatePath('/admin/proposals')

  return { success: true, message: 'MSA updated successfully' }
}

// ============================================================
// Send MSA to Client
// ============================================================

export async function sendMSA(msaId: string, input: SendMSAInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get MSA
  const { data: msa, error: msaError } = await supabase
    .from('client_msas')
    .select('id, client_id, status')
    .eq('id', msaId)
    .single()

  if (msaError || !msa) {
    return { success: false, message: 'MSA not found' }
  }

  if (msa.status === 'signed') {
    return { success: false, message: 'MSA is already signed' }
  }

  // Verify client user
  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select('id, name, email, client_id')
    .eq('id', input.clientUserId)
    .single()

  if (clientUserError || !clientUser) {
    return { success: false, message: 'Client user not found' }
  }

  // Ensure client user belongs to the MSA's client
  if (clientUser.client_id !== msa.client_id) {
    return { success: false, message: 'Client user does not belong to this client' }
  }

  try {
    // Check/create portal token
    const { data: existingToken } = await supabase
      .from('client_portal_tokens')
      .select('id, token')
      .eq('client_user_id', clientUser.id)
      .is('revoked_at', null)
      .single()

    let portalToken: string

    if (existingToken) {
      portalToken = existingToken.token
    } else {
      portalToken = generatePortalToken()
      const { error: tokenError } = await supabase
        .from('client_portal_tokens')
        .insert({
          client_user_id: clientUser.id,
          token: portalToken
        })

      if (tokenError) {
        console.error('[sendMSA] Token error:', tokenError)
        return { success: false, message: 'Failed to generate portal access link' }
      }
    }

    // Update MSA status
    const { error: updateError } = await supabase
      .from('client_msas')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to_client_user_id: clientUser.id
      })
      .eq('id', msaId)

    if (updateError) {
      console.error('[sendMSA] Update error:', updateError)
      return { success: false, message: 'Failed to update MSA status' }
    }

    revalidatePath('/admin/proposals')
    revalidatePath(`/admin/clients/${msa.client_id}`)

    const portalUrl = `/portal/msa/${msaId}?token=${portalToken}`

    return {
      success: true,
      message: `MSA sent to ${clientUser.name}`,
      portalUrl,
      clientUserEmail: clientUser.email
    }
  } catch (error) {
    console.error('[sendMSA] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Sign MSA (Client Portal)
// ============================================================

export async function signMSA(msaId: string, input: SignMSAInput) {
  const supabase = await createClient()

  // Validate token
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select(`
      id,
      client_user_id,
      revoked_at,
      view_count,
      client_users (
        id,
        name,
        email,
        client_id
      )
    `)
    .eq('token', input.token)
    .single()

  if (tokenError || !tokenData) {
    return { success: false, message: 'Invalid access token' }
  }

  if (tokenData.revoked_at) {
    return { success: false, message: 'Access token has been revoked' }
  }

  // Supabase joins return arrays - extract first element
  const clientUsersData = tokenData.client_users
  const clientUser = Array.isArray(clientUsersData) ? clientUsersData[0] : clientUsersData

  if (!clientUser) {
    return { success: false, message: 'Invalid client user' }
  }

  // Get MSA and verify it belongs to this client
  const { data: msa, error: msaError } = await supabase
    .from('client_msas')
    .select('id, client_id, status')
    .eq('id', msaId)
    .single()

  if (msaError || !msa) {
    return { success: false, message: 'MSA not found' }
  }

  if (msa.client_id !== clientUser.client_id) {
    return { success: false, message: 'Access denied' }
  }

  if (msa.status === 'signed') {
    return { success: false, message: 'This MSA has already been signed' }
  }

  try {
    const now = new Date().toISOString()

    // Update MSA with signature
    const { error: updateError } = await supabase
      .from('client_msas')
      .update({
        status: 'signed',
        signed_at: now,
        signer_name: input.signerName,
        signer_email: input.signerEmail,
        signature_svg: input.signatureSvg,
        ip_address: input.ipAddress || null
      })
      .eq('id', msaId)

    if (updateError) {
      console.error('[signMSA] Update error:', updateError)
      return { success: false, message: 'Failed to record signature' }
    }

    // Create contract doc entry
    const { error: contractDocError } = await supabase
      .from('contract_docs')
      .insert({
        client_id: msa.client_id,
        project_id: null,
        doc_type: 'msa',
        title: 'Master Service Agreement',
        version: 1,
        file_path: '', // PDF path will be set after generation
        signed_at: now,
        source_table: 'client_msas',
        source_id: msaId
      })

    if (contractDocError) {
      console.error('[signMSA] Contract doc error:', contractDocError)
      // Non-critical, continue
    }

    // Update token view count
    await supabase
      .from('client_portal_tokens')
      .update({
        last_viewed_at: now,
        view_count: (tokenData.view_count || 0) + 1
      })
      .eq('id', tokenData.id)

    return {
      success: true,
      message: 'MSA signed successfully',
      signedAt: now
    }
  } catch (error) {
    console.error('[signMSA] Unexpected error:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================
// Get MSA for Client
// ============================================================

export async function getMSA(clientId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: msa, error } = await supabase
    .from('client_msas')
    .select(`
      *,
      client:clients(id, name, email),
      created_by_employee:employees!client_msas_created_by_fkey(id, name),
      sent_to:client_users(id, name, email)
    `)
    .eq('client_id', clientId)
    .single()

  if (error) {
    // No MSA exists for this client
    return { success: true, msa: null }
  }

  return { success: true, msa }
}

// ============================================================
// Check if client has signed MSA
// ============================================================

export async function hasSignedMSA(clientId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: msa } = await supabase
    .from('client_msas')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'signed')
    .single()

  return !!msa
}

// ============================================================
// Helpers
// ============================================================

function generatePortalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
