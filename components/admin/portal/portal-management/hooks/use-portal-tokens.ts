import { useState, useEffect } from 'react'
import {
  createClientPortalToken,
  revokeClientPortalToken,
  getClientPortalStatus,
} from '@/lib/integrations/portal'
import { toast } from 'sonner'

interface PortalTokenStatus {
  hasActiveToken: boolean
  url: string | null
  viewCount: number
  lastViewedAt: string | null
  tokenId: string | null
}

export function usePortalTokens(userId: string) {
  const [status, setStatus] = useState<PortalTokenStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    async function fetchStatus() {
      const result = await getClientPortalStatus(userId)
      setStatus({
        hasActiveToken: result.hasActiveToken,
        url: result.url,
        viewCount: result.viewCount,
        lastViewedAt: result.lastViewedAt,
        tokenId: result.token?.id || null,
      })
      setLoading(false)
    }
    fetchStatus()
  }, [userId])

  async function generateLink() {
    setGenerating(true)
    try {
      const result = await createClientPortalToken(userId)
      if (result.success) {
        setStatus({
          hasActiveToken: true,
          url: result.url,
          viewCount: 0,
          lastViewedAt: null,
          tokenId: result.token.id,
        })
        toast.success('Portal link generated')
        return result
      } else {
        const errorMessage = result.error ?? 'Unknown error generating link'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      toast.error('Failed to generate link')
      throw error
    } finally {
      setGenerating(false)
    }
  }

  async function revokeLink() {
    if (!status?.tokenId) return

    setRevoking(true)
    try {
      const result = await revokeClientPortalToken(status.tokenId)
      if (result.success) {
        setStatus({
          hasActiveToken: false,
          url: null,
          viewCount: 0,
          lastViewedAt: null,
          tokenId: null,
        })
        toast.success('Portal link revoked')
        return result
      } else {
        const errorMessage = result.error ?? 'Unknown error revoking link'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      toast.error('Failed to revoke link')
      throw error
    } finally {
      setRevoking(false)
    }
  }

  function copyToClipboard() {
    if (status?.url) {
      navigator.clipboard.writeText(status.url)
      toast.success('Link copied to clipboard')
    }
  }

  return {
    status,
    loading,
    generating,
    revoking,
    generateLink,
    revokeLink,
    copyToClipboard,
  }
}
