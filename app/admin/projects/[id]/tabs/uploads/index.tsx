'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, Image, File, Trash2 } from 'lucide-react'
import { uploadAdminFile, getUploadSignedUrl, deleteUpload, type UploadItem } from './actions'
export type { UploadItem }
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface AdminUploadsTabProps {
  projectId: string
  projectName: string
  currentUserId: string
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

export function AdminUploadsTab({
  projectId,
  projectName,
  currentUserId,
  initialUploads,
}: AdminUploadsTabProps) {
  const [uploads, setUploads] = useState<UploadItem[]>(initialUploads)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadAdminFile(projectId, formData, currentUserId)

      if (result.success && result.upload) {
        setUploads((prev) => [result.upload!, ...prev])
        toast.success('File uploaded successfully')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Network error uploading file')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(uploadId: string, fileName: string) {
    setDownloading(uploadId)
    try {
      const result = await getUploadSignedUrl(uploadId)

      if (result.success && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Network error downloading file')
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(uploadId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    setDeleting(uploadId)
    try {
      const result = await deleteUpload(uploadId)

      if (result.success) {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
        toast.success('File deleted')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Network error deleting file')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Uploads</h2>
          <p className="text-muted-foreground">
            Share files and assets for {projectName}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip"
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
            Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, ZIP. Maximum file size: 50MB.
          </p>
        </CardContent>
      </Card>

      {/* Uploads list */}
      {uploads.length === 0 ? (
        <Card className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No uploads yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the upload button to share files with the client
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
                          <span>&bull;</span>
                          <Badge variant={upload.uploaded_by_type === 'owner' ? 'default' : 'secondary'} className="text-xs">
                            {upload.uploaded_by_type === 'owner' ? 'Team' : 'Client'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(upload.id, upload.file_name)}
                        disabled={downloading === upload.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === upload.id ? 'Loading...' : 'Download'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(upload.id)}
                        disabled={deleting === upload.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
