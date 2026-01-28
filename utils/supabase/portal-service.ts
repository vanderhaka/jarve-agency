/**
 * Portal Service Client
 *
 * SECURITY: This client uses the service_role key which bypasses Row Level Security.
 * It must ONLY be used in server actions that perform their own authorization checks
 * (validating portal tokens before accessing data).
 *
 * The service_role key is stored in SUPABASE_SERVICE_ROLE_KEY (NOT NEXT_PUBLIC_)
 * and is never exposed to the browser.
 *
 * Authorization flow:
 * 1. Portal action receives token from client
 * 2. Action validates token against client_portal_tokens table
 * 3. Action verifies resource ownership (invoice/project belongs to token's client)
 * 4. Only after validation does the action fetch/modify data
 *
 * This pattern replaces the previous anon client + permissive RLS approach,
 * which exposed all portal data to anyone with the public anon key.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client using the service_role key.
 *
 * WARNING: This client bypasses RLS. Only use in server actions that validate
 * portal tokens before accessing any data.
 *
 * @throws Error if required environment variables are missing
 */
export function createPortalServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'Portal actions require the service role key for secure data access.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Service role client should not persist sessions
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
