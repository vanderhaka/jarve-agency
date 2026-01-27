import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export interface ClientUser {
  id: string
  name: string
  email: string
  created_at: string
}

export function usePortalUsers(clientId: string) {
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClientUsers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_users')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setClientUsers(data)
      }
      setLoading(false)
    }
    fetchClientUsers()
  }, [clientId])

  async function addUser(name: string, email: string) {
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from('client_users')
      .insert({
        client_id: clientId,
        name: name.trim(),
        email: email.trim(),
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to add user')
    }

    setClientUsers((prev) => [user, ...prev])
    return user
  }

  return {
    clientUsers,
    loading,
    addUser,
  }
}
