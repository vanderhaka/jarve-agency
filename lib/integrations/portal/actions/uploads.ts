/**
 * Portal Uploads
 * File upload handling for the client portal
 */

'use server'

import { createClient } from '@/utils/supabase/server'
import { createAnonClient } from '@/utils/supabase/anon'
import type { ClientUpload } from '../types'
import { validateTokenForProject } from './tokens'

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
