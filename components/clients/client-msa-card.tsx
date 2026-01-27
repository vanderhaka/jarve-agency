'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, FileSignature } from 'lucide-react'
import { createMSA } from '@/app/admin/proposals/msa-actions'
import { MSASection } from './msa-section'

interface MSA {
  id: string
  title: string
  status: string
  sent_at: string | null
  signed_at: string | null
  signer_name: string | null
  signer_email: string | null
}

interface ClientUser {
  id: string
  name: string
  email: string
}

interface ClientMSACardProps {
  clientId: string
  clientName: string
}

export function ClientMSACard({ clientId, clientName }: ClientMSACardProps) {
  const [loading, setLoading] = useState(true)
  const [msa, setMsa] = useState<MSA | null>(null)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [msaRes, usersRes] = await Promise.all([
      supabase
        .from('client_msas')
        .select('id, title, status, sent_at, signed_at, signer_name, signer_email')
        .eq('client_id', clientId)
        .single(),
      supabase
        .from('client_users')
        .select('id, name, email')
        .eq('client_id', clientId)
    ])

    if (msaRes.data) {
      setMsa(msaRes.data)
    }

    if (usersRes.data) {
      setClientUsers(usersRes.data)
    }

    setLoading(false)
  }, [supabase, clientId])

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateMSA = async () => {
    setCreating(true)
    const result = await createMSA({ clientId })
    if (result.success) {
      fetchData()
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Master Service Agreement</CardTitle>
            <CardDescription>
              One-time agreement required before active work
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MSASection
          msa={msa}
          clientName={clientName}
          clientUsers={clientUsers}
          creating={creating}
          onCreateMSA={handleCreateMSA}
          onMSAUpdated={fetchData}
        />
      </CardContent>
    </Card>
  )
}
