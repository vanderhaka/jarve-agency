/**
 * Portal Manifest
 * Token validation and manifest retrieval for portal access
 */

'use server'

import { createPortalServiceClient } from '@/utils/supabase/portal-service'
import type { PortalManifest, PortalProject } from '../types'

/** Epoch timestamp used when no read state exists (user has never read messages) */
const EPOCH_TIMESTAMP = '1970-01-01T00:00:00Z'

/**
 * Get unread message count for a project/user
 */
async function getUnreadCount(
  supabase: ReturnType<typeof createPortalServiceClient>,
  projectId: string,
  userType: 'owner' | 'client',
  userId: string
): Promise<number> {
  // Get the last read timestamp
  const { data: readState } = await supabase
    .from('portal_read_state')
    .select('last_read_at')
    .eq('project_id', projectId)
    .eq('user_type', userType)
    .eq('user_id', userId)
    .single()

  // If no read state exists, treat all messages as unread (use epoch)
  const lastReadAt = readState?.last_read_at ?? EPOCH_TIMESTAMP

  // Count messages after last read (from the other party)
  const otherType = userType === 'client' ? 'owner' : 'client'
  const { count } = await supabase
    .from('portal_messages')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('author_type', otherType)
    .gt('created_at', lastReadAt)

  return count ?? 0
}

/**
 * Validate a portal token and return the portal manifest
 * This is the main entry point for portal access
 */
export async function getPortalManifest(
  token: string
): Promise<{ success: true; manifest: PortalManifest } | { success: false; error: string }> {
  try {
    const supabase = createPortalServiceClient()

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_user_id, view_count')
      .eq('token', token)
      .is('revoked_at', null)
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or revoked token' }
    }

    // Update view stats
    await supabase
      .from('client_portal_tokens')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (tokenData.view_count ?? 0) + 1,
      })
      .eq('id', tokenData.id)

    // Get client user
    const { data: clientUser, error: userError } = await supabase
      .from('client_users')
      .select('id, name, email, client_id')
      .eq('id', tokenData.client_user_id)
      .single()

    if (userError || !clientUser) {
      return { success: false, error: 'Client user not found' }
    }

    // Get client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, company')
      .eq('id', clientUser.client_id)
      .single()

    if (clientError || !client) {
      return { success: false, error: 'Client not found' }
    }

    // Get projects for this client
    const { data: projects, error: projectsError } = await supabase
      .from('agency_projects')
      .select('id, name, status, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      return { success: false, error: 'Failed to fetch projects' }
    }

    // Get unread counts for each project
    const projectsWithUnread: PortalProject[] = await Promise.all(
      (projects ?? []).map(async (project) => {
        const unreadCount = await getUnreadCount(
          supabase,
          project.id,
          'client',
          clientUser.id
        )
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          created_at: project.created_at,
          unread_count: unreadCount,
        }
      })
    )

    return {
      success: true,
      manifest: {
        clientUser: {
          id: clientUser.id,
          name: clientUser.name,
          email: clientUser.email,
        },
        client: {
          id: client.id,
          name: client.name,
          company: client.company,
        },
        projects: projectsWithUnread,
      },
    }
  } catch (error) {
    console.error('Error getting portal manifest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
