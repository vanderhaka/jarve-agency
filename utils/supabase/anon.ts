import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client that uses the anon key without any session cookies.
 * Use this for unauthenticated operations like the client portal.
 */
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
