import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Admin actions usually need service role, but for now using public if RLS permits or if user is logged in
// Actually, I need to use the service role key to bypass RLS if I'm running this as a script
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZGRveW5weG52YmR2Y2VraWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg1NzczNCwiZXhwIjoyMDc5NDMzNzM0fQ.C5Rofi6LsivDbSjanPSqV90f4v8OVnY2uDvXDDsJgTg'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createEmployee() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const adminUser = users.find(u => u.email === 'admin@jarve.com')
  
  if (!adminUser) {
    console.error('Admin user not found')
    return
  }

  // Check if employee exists
  const { data: existing } = await supabase.from('employees').select('id').eq('id', adminUser.id).single()
  
  if (!existing) {
    const { error } = await supabase.from('employees').insert({
      id: adminUser.id,
      email: adminUser.email!,
      name: 'Admin User',
      role: 'admin'
    })
    
    if (error) console.error('Error creating employee:', error)
    else console.log('Employee created for admin')
  } else {
    console.log('Employee already exists')
  }
}

createEmployee()
