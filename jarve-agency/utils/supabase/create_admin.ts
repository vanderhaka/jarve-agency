import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@jarve.com',
    password: 'password123',
  })
  
  if (error) console.error('Error creating user:', error)
  else console.log('User created:', data.user?.email)
}

createAdmin()
