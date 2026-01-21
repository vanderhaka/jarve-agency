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
