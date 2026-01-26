/**
 * Portal Actions
 * Server actions for client portal functionality (Stage 4)
 *
 * Handles:
 * - Token validation and manifest retrieval
 * - Chat messages (portal_messages)
 * - File uploads (client_uploads)
 * - Read state tracking (portal_read_state)
 */

'use server'

import { createClient } from '@/utils/supabase/server'
import { createAnonClient } from '@/utils/supabase/anon'
import type {
  PortalManifest,
  PortalMessage,
  ClientUpload,
  PortalProject,
  ContractDoc,
} from './types'

/**
 * Validate a portal token and return the portal manifest
 * This is the main entry point for portal access
 */
export async function getPortalManifest(
  token: string
): Promise<{ success: true; manifest: PortalManifest } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Debug: Log token lookup (first/last 4 chars for security)
    const tokenPreview = token.length > 8 
      ? `${token.slice(0, 4)}...${token.slice(-4)}` 
      : token
    console.log(`[Portal] Looking up token: ${tokenPreview} (length: ${token.length})`)

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_user_id, view_count')
      .eq('token', token)
      .is('revoked_at', null)
      .single()

    if (tokenError || !tokenData) {
      console.log(`[Portal] Token lookup failed:`, tokenError?.message || 'No token found')
      return { success: false, error: 'Invalid or revoked token' }
    }

    // Update view stats
    await supabase
      .from('client_portal_tokens')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (tokenData.view_count || 0) + 1,
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
      (projects || []).map(async (project) => {
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

/**
 * Get unread message count for a project/user
 */
async function getUnreadCount(
  supabase: ReturnType<typeof createAnonClient>,
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

  const lastReadAt = readState?.last_read_at || '1970-01-01T00:00:00Z'

  // Count messages after last read (from the other party)
  const otherType = userType === 'client' ? 'owner' : 'client'
  const { count } = await supabase
    .from('portal_messages')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('author_type', otherType)
    .gt('created_at', lastReadAt)

  return count || 0
}

/**
 * Get messages for a project
 */
export async function getPortalMessages(
  token: string,
  projectId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: true; messages: PortalMessage[] } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Fetch messages - order descending to get the N most recent, then reverse for chronological display
    const { data: messages, error } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: 'Failed to fetch messages' }
    }

    // Reverse to restore chronological order (oldest to newest) for display
    return { success: true, messages: (messages as PortalMessage[]).reverse() }
  } catch (error) {
    console.error('Error getting portal messages:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Post a new message to a project chat
 */
export async function postPortalMessage(
  token: string,
  projectId: string,
  body: string
): Promise<{ success: true; message: PortalMessage } | { success: false; error: string }> {
  try {
    console.log('[Portal] postPortalMessage called with projectId:', projectId, 'body length:', body.length)
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      console.log('[Portal] Token validation failed:', validation.error)
      return { success: false, error: validation.error }
    }
    console.log('[Portal] Token validated, clientUserId:', validation.clientUserId)

    // Insert message
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        project_id: projectId,
        author_type: 'client',
        author_id: validation.clientUserId,
        body: body.trim(),
      })
      .select()
      .single()

    if (error || !message) {
      console.log('[Portal] Insert message error:', error)
      return { success: false, error: 'Failed to post message' }
    }

    console.log('[Portal] Message posted successfully:', message.id)
    return { success: true, message: message as PortalMessage }
  } catch (error) {
    console.error('Error posting portal message:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Post a message as the owner (admin side)
 */
export async function postOwnerMessage(
  projectId: string,
  body: string,
  authorId: string
): Promise<{ success: true; message: PortalMessage } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    // Insert message as owner
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        project_id: projectId,
        author_type: 'owner',
        author_id: authorId,
        body: body.trim(),
      })
      .select()
      .single()

    if (error || !message) {
      return { success: false, error: 'Failed to post message' }
    }

    return { success: true, message: message as PortalMessage }
  } catch (error) {
    console.error('Error posting owner message:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update read state for a user on a project
 */
export async function updateReadState(
  token: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Upsert read state
    const { error } = await supabase
      .from('portal_read_state')
      .upsert(
        {
          project_id: projectId,
          user_type: 'client',
          user_id: validation.clientUserId,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_type,user_id',
        }
      )

    if (error) {
      return { success: false, error: 'Failed to update read state' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating read state:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update read state as owner (admin side)
 */
export async function updateOwnerReadState(
  projectId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portal_read_state')
      .upsert(
        {
          project_id: projectId,
          user_type: 'owner',
          user_id: ownerId,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_type,user_id',
        }
      )

    if (error) {
      return { success: false, error: 'Failed to update read state' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating owner read state:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get uploads for a project
 */
export async function getClientUploads(
  token: string,
  projectId: string
): Promise<{ success: true; uploads: ClientUpload[] } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Fetch uploads
    const { data: uploads, error } = await supabase
      .from('client_uploads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Failed to fetch uploads' }
    }

    return { success: true, uploads: uploads as ClientUpload[] }
  } catch (error) {
    console.error('Error getting client uploads:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload a file to a project
 */
export async function uploadClientFile(
  token: string,
  projectId: string,
  formData: FormData
): Promise<{ success: true; upload: ClientUpload } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 50MB limit' }
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF' }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${projectId}/${timestamp}_${sanitizedName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('client-uploads')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: 'Failed to upload file' }
    }

    // Create database record
    const { data: upload, error: dbError } = await supabase
      .from('client_uploads')
      .insert({
        project_id: projectId,
        uploaded_by_type: 'client',
        uploaded_by_id: validation.clientUserId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError || !upload) {
      // Try to clean up the uploaded file
      await supabase.storage.from('client-uploads').remove([filePath])
      return { success: false, error: 'Failed to save upload record' }
    }

    return { success: true, upload: upload as ClientUpload }
  } catch (error) {
    console.error('Error uploading client file:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a signed URL for downloading a file
 */
export async function getUploadSignedUrl(
  token: string,
  uploadId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const supabase = createAnonClient()

    // Get the upload record
    const { data: upload, error: uploadError } = await supabase
      .from('client_uploads')
      .select('project_id, file_path')
      .eq('id', uploadId)
      .single()

    if (uploadError || !upload) {
      return { success: false, error: 'Upload not found' }
    }

    // Validate token for this project
    const validation = await validateTokenForProject(supabase, token, upload.project_id)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate signed URL (1 hour expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('client-uploads')
      .createSignedUrl(upload.file_path, 3600)

    if (urlError || !signedUrl) {
      return { success: false, error: 'Failed to generate download URL' }
    }

    return { success: true, url: signedUrl.signedUrl }
  } catch (error) {
    console.error('Error getting upload signed URL:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

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

/**
 * Delete a client upload (admin only)
 */
export async function deleteClientUpload(
  uploadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the upload to find file path
    const { data: upload, error: fetchError } = await supabase
      .from('client_uploads')
      .select('file_path')
      .eq('id', uploadId)
      .single()

    if (fetchError || !upload) {
      return { success: false, error: 'Upload not found' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('client-uploads')
      .remove([upload.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('client_uploads')
      .delete()
      .eq('id', uploadId)

    if (dbError) {
      return { success: false, error: 'Failed to delete upload record' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting client upload:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Validate a token has access to a specific project
 */
async function validateTokenForProject(
  supabase: ReturnType<typeof createAnonClient>,
  token: string,
  projectId: string
): Promise<{ valid: true; clientUserId: string; clientId: string } | { valid: false; error: string }> {
  // Get token and client user
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('client_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Get client user's client_id
  const { data: clientUser, error: userError } = await supabase
    .from('client_users')
    .select('id, client_id')
    .eq('id', tokenData.client_user_id)
    .single()

  if (userError || !clientUser) {
    return { valid: false, error: 'Client user not found' }
  }

  // Verify project belongs to this client
  const { data: project, error: projectError } = await supabase
    .from('agency_projects')
    .select('id')
    .eq('id', projectId)
    .eq('client_id', clientUser.client_id)
    .single()

  if (projectError || !project) {
    return { valid: false, error: 'Project not found or access denied' }
  }

  return { valid: true, clientUserId: clientUser.id, clientId: clientUser.client_id }
}

/**
 * Validate a token has access to a specific client
 * Used for client-level documents (MSAs) that aren't tied to a specific project
 */
async function validateTokenForClient(
  supabase: ReturnType<typeof createAnonClient>,
  token: string,
  clientId: string
): Promise<{ valid: true; clientUserId: string; clientId: string } | { valid: false; error: string }> {
  // Get token and client user
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_portal_tokens')
    .select('client_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Get client user's client_id
  const { data: clientUser, error: userError } = await supabase
    .from('client_users')
    .select('id, client_id')
    .eq('id', tokenData.client_user_id)
    .single()

  if (userError || !clientUser) {
    return { valid: false, error: 'Client user not found' }
  }

  // Verify the document's client_id matches the token holder's client_id
  if (clientUser.client_id !== clientId) {
    return { valid: false, error: 'Access denied' }
  }

  return { valid: true, clientUserId: clientUser.id, clientId: clientUser.client_id }
}
