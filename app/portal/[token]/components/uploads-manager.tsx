'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, Image, File, Trash2 } from 'lucide-react'
import { usePortal } from './portal-context'
import { uploadClientFile, getUploadSignedUrl } from '@/lib/integrations/portal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface UploadItem {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by_type: string
  created_at: string
}

interface UploadsManagerProps {
  initialUploads: UploadItem[]
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText
  return File
}

export function UploadsManager({ initialUploads }: UploadsManagerProps) {
  const { token, selectedProject } = usePortal()
  const [uploads, setUploads] = useState<UploadItem[]>(initialUploads)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedProject) return

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadClientFile(token, selectedProject.id, formData)

      if (result.success) {
        setUploads((prev) => [result.upload, ...prev])
        toast.success('File uploaded successfully')
      } else {
        toast.error(result.error || 'Failed to upload file')
      }
    } catch (error) {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(uploadId: string, fileName: string) {
    setDownloading(uploadId)
    try {
      const result = await getUploadSignedUrl(token, uploadId)

      if (result.success) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = result.url
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error(result.error || 'Failed to get download link')
      }
    } catch (error) {
      toast.error('Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  if (!selectedProject) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No project selected</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Uploads</h1>
          <p className="text-muted-foreground">
            Share files and assets for {selectedProject.name}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {/* Upload info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF. Maximum file size: 50MB.
          </p>
        </CardContent>
      </Card>

      {/* Uploads list */}
      {uploads.length === 0 ? (
        <Card className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No uploads yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the upload button to share files with the team
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => {
            const FileIcon = getFileIcon(upload.mime_type)
            return (
              <Card key={upload.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{upload.file_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(upload.file_size)}</span>
                          <span>&bull;</span>
                          <span>
                            {new Date(upload.created_at).toLocaleDateString()}
                          </span>
                          {upload.uploaded_by_type === 'owner' && (
                            <>
                              <span>&bull;</span>
                              <Badge variant="secondary" className="text-xs">
                                From team
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(upload.id, upload.file_name)}
                      disabled={downloading === upload.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloading === upload.id ? 'Loading...' : 'Download'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
