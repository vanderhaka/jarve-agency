'use server'

import { requireEmployee } from '@/lib/auth/require-employee'
import { sendProposal } from './email'

// ============================================================
// Create Client from Lead and Send Proposal
// Note: Lead is NOT marked as converted here - that happens when
// the proposal is signed (in signProposal)
// ============================================================

export async function convertLeadAndSend(proposalId: string, leadId: string) {
  const { supabase, user } = await requireEmployee()

  // Get the lead (includes client_id to avoid N+1 query)
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, name, email, company, client_id')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { success: false, message: 'Lead not found' }
  }

  if (!lead.email) {
    return { success: false, message: 'Lead has no email address' }
  }

  // Check if client already exists for this lead
  let clientId: string

  if (lead.client_id) {
    clientId = lead.client_id
  } else {
    // Create client from lead
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: lead.company || lead.name,
        email: lead.email,
        created_by: user.id
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      console.error('[convertLeadAndSend] Client creation error:', clientError)
      return { success: false, message: 'Failed to create client' }
    }

    clientId = newClient.id

    // Link lead to client (conversion happens when proposal is signed)
    await supabase
      .from('leads')
      .update({ client_id: clientId })
      .eq('id', leadId)
  }

  // Check if client_user exists for this email
  let clientUserId: string
  const { data: existingUser } = await supabase
    .from('client_users')
    .select('id')
    .eq('client_id', clientId)
    .eq('email', lead.email)
    .single()

  if (existingUser) {
    clientUserId = existingUser.id
  } else {
    // Create client_user
    const { data: newUser, error: userError } = await supabase
      .from('client_users')
      .insert({
        client_id: clientId,
        name: lead.name,
        email: lead.email
      })
      .select('id')
      .single()

    if (userError || !newUser) {
      console.error('[convertLeadAndSend] Client user creation error:', userError)
      return { success: false, message: 'Failed to create client contact' }
    }

    clientUserId = newUser.id
  }

  // Update proposal with client_id
  await supabase
    .from('proposals')
    .update({ client_id: clientId })
    .eq('id', proposalId)

  // Now send using the existing flow
  return sendProposal(proposalId, { clientUserId })
}
