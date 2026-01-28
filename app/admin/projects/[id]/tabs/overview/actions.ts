'use server'

import { createClient } from '@/utils/supabase/server'
import { sendPortalLinkEmail } from '@/lib/email/resend'
import { generatePortalToken } from '@/app/admin/proposals/actions/helpers'

interface SendPortalLinkResult {
  success: boolean
  message: string
}

export async function sendPortalLink(projectId: string): Promise<SendPortalLinkResult> {
  const supabase = await createClient()

  // Get project with client info
  const { data: project, error: projectError } = await supabase
    .from('agency_projects')
    .select(`
      id,
      name,
      client_id,
      clients (
        id,
        name
      )
    `)
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, message: 'Project not found' }
  }

  if (!project.client_id) {
    return { success: false, message: 'No client assigned to this project' }
  }

  // Get primary client user
  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select('id, name, email')
    .eq('client_id', project.client_id)
    .eq('is_primary', true)
    .single()

  if (clientUserError || !clientUser) {
    // Fallback to any client user if no primary
    const { data: anyUser, error: anyError } = await supabase
      .from('client_users')
      .select('id, name, email')
      .eq('client_id', project.client_id)
      .limit(1)
      .single()

    if (anyError || !anyUser) {
      return { success: false, message: 'No client user found' }
    }

    return sendEmailToUser(supabase, anyUser, project)
  }

  return sendEmailToUser(supabase, clientUser, project)
}

async function sendEmailToUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientUser: { id: string; name: string; email: string },
  project: { id: string; name: string }
): Promise<SendPortalLinkResult> {
  // Check for existing portal token
  const { data: existingToken } = await supabase
    .from('client_portal_tokens')
    .select('token')
    .eq('client_user_id', clientUser.id)
    .is('revoked_at', null)
    .single()

  let portalToken: string

  if (existingToken) {
    portalToken = existingToken.token
  } else {
    // Create new portal token
    portalToken = generatePortalToken()
    const { error: tokenError } = await supabase
      .from('client_portal_tokens')
      .insert({
        client_user_id: clientUser.id,
        token: portalToken
      })

    if (tokenError) {
      console.error('[sendPortalLink] Token creation error:', tokenError)
      return { success: false, message: 'Failed to generate portal link' }
    }
  }

  const portalUrl = `/portal/${portalToken}`

  try {
    await sendPortalLinkEmail({
      to: clientUser.email,
      recipientName: clientUser.name,
      projectName: project.name,
      portalUrl
    })

    return {
      success: true,
      message: `Portal link sent to ${clientUser.email}`
    }
  } catch (error) {
    console.error('[sendPortalLink] Email error:', error)
    return { success: false, message: 'Failed to send email' }
  }
}
