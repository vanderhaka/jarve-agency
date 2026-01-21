import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(name: string, fallbackName?: string): string {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}${fallbackName ? ` or ${fallbackName}` : ''}`)
  }
  return value
}

const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
const supabaseKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
const adminEmail = getRequiredEnv('ADMIN_EMAIL')
const adminPassword = getRequiredEnv('ADMIN_PASSWORD')

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
  })
  
  if (error) console.error('Error creating user:', error)
  else console.log('User created:', data.user?.email)
}

createAdmin()
