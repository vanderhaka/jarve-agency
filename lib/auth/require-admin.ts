import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

interface AdminAuth {
  supabase: SupabaseClient
  user: { id: string; email?: string }
}

/**
 * Require admin role for API route handlers.
 * Returns null + sends error response if not authorized.
 */
export async function requireAdmin(): Promise<
  | AdminAuth
  | NextResponse
> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee || employee.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 })
  }

  return { supabase, user }
}

/**
 * Type guard to check if requireAdmin returned an error response.
 */
export function isAuthError(result: AdminAuth | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
