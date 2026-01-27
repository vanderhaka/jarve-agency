import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthenticatedEmployee {
  supabase: SupabaseClient
  user: { id: string; email?: string }
  employee: { id: string }
}

/**
 * Require an authenticated employee for server actions.
 * Redirects to login if not authenticated.
 * Throws error if user is not a valid employee.
 */
export async function requireEmployee(): Promise<AuthenticatedEmployee> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    throw new Error('Employee not found')
  }

  return { supabase, user, employee }
}

/**
 * Require authentication only (no employee check).
 * Use for actions that any authenticated user can perform.
 */
export async function requireAuth(): Promise<{ supabase: SupabaseClient; user: { id: string; email?: string } }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}
