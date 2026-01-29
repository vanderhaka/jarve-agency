'use server'

import { createClient } from '@/utils/supabase/server'

export interface UploadItem {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by_type: string
  created_at: string
}

export async function getProjectUploads(projectId: string): Promise<{
  success: boolean
  uploads: UploadItem[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_uploads')
    .select('id, file_name, file_size, mime_type, uploaded_by_type, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching project uploads:', error)
    return { success: false, uploads: [], error: error.message }
  }

  return { success: true, uploads: data ?? [] }
}

export async function getUploadSignedUrl(uploadId: string): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const supabase = await createClient()

  const { data: upload, error: uploadError } = await supabase
    .from('client_uploads')
    .select('file_path')
    .eq('id', uploadId)
    .single()

  if (uploadError || !upload?.file_path) {
    return { success: false, error: 'Upload not found' }
  }

  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('client-uploads')
    .createSignedUrl(upload.file_path, 3600)

  if (urlError || !signedUrl?.signedUrl) {
    return { success: false, error: 'Could not generate download link' }
  }

  return { success: true, url: signedUrl.signedUrl }
}

export async function uploadAdminFile(
  projectId: string,
  formData: FormData
): Promise<{
  success: boolean
  upload?: UploadItem
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Generate unique file path
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${projectId}/${timestamp}-${safeName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('client-uploads')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { success: false, error: 'Failed to upload file' }
  }

  // Create database record
  const { data: upload, error: dbError } = await supabase
    .from('client_uploads')
    .insert({
      project_id: projectId,
      uploaded_by_type: 'owner',
      uploaded_by_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    })
    .select('id, file_name, file_size, mime_type, uploaded_by_type, created_at')
    .single()

  if (dbError || !upload) {
    console.error('Error creating upload record:', dbError)
    return { success: false, error: 'Failed to save upload record' }
  }

  return { success: true, upload }
}

export async function deleteUpload(uploadId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // Get file path first
  const { data: upload, error: fetchError } = await supabase
    .from('client_uploads')
    .select('file_path')
    .eq('id', uploadId)
    .single()

  if (fetchError || !upload?.file_path) {
    return { success: false, error: 'Upload not found' }
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('client-uploads')
    .remove([upload.file_path])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('client_uploads')
    .delete()
    .eq('id', uploadId)

  if (dbError) {
    return { success: false, error: 'Failed to delete upload' }
  }

  return { success: true }
}
