import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bxddoynpxnvbdvcekiey.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZGRveW5weG52YmR2Y2VraWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1NzczNCwiZXhwIjoyMDc5NDMzNzM0fQ.C5Rofi6LsivDbSjanPSqV90f4v8OVnY2uDvXDDsJgTg'
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
