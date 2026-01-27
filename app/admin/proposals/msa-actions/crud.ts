'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { MSAContent, CreateMSAInput } from './types'

// ============================================================
// Constants
// ============================================================

const DEFAULT_MSA_TITLE = 'Master Service Agreement'

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
    const msaTitle = input.title ?? DEFAULT_MSA_TITLE
    const msaContent = input.content ?? defaultContent

    const { data: msa, error: msaError } = await supabase
      .from('client_msas')
      .insert({
        client_id: input.clientId,
        title: msaTitle,
        content: msaContent,
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
