import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function confirmUser() {
  // Get the user ID first
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const user = users.find(u => u.email === 'admin@jarve.com')
  
  if (!user) {
    console.error('User not found')
    return
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  )
  
  if (error) console.error('Error confirming user:', error)
  else console.log('User confirmed:', data.user.email)
}

confirmUser()
