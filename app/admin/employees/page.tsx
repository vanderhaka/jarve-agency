import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { InviteEmployeeForm } from './invite-employee-form'
import { EmployeesTableWrapper } from './employees-table-wrapper'
import {
  performEmployeeInvite,
  resolveSiteUrlFromHeaders,
  validateInvitePayload,
  type InviteEmployeeState,
} from '@/lib/admin/invite'

const DEFAULT_EMPLOYEE_ROLE = 'employee'

const INVITE_EMPLOYEE_INITIAL_STATE: InviteEmployeeState = {
  status: 'idle',
  message: null,
}

async function inviteEmployee(
  _prevState: InviteEmployeeState,
  formData: FormData
): Promise<InviteEmployeeState> {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (employee?.role !== 'admin') {
    redirect('/admin')
  }

  const validation = validateInvitePayload(
    {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as string,
    },
    DEFAULT_EMPLOYEE_ROLE
  )
  if (!validation.ok) {
    return {
      status: 'error',
      message: validation.message,
    }
  }

  const { email, name, role } = validation

  // Check if email is already registered using database function
  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (error) {
    console.error('[inviteEmployee] Admin client error:', error)
    return {
      status: 'error',
      message: 'Admin credentials are not configured. Please contact support.',
    }
  }

  const headerList = await headers()
  const siteUrl = resolveSiteUrlFromHeaders(
    {
      origin: headerList.get('origin'),
      host: headerList.get('host'),
      'x-forwarded-host': headerList.get('x-forwarded-host'),
      'x-forwarded-proto': headerList.get('x-forwarded-proto'),
    },
    process.env.NEXT_PUBLIC_SITE_URL
  )
  if (!siteUrl) {
    console.error('[inviteEmployee] Site URL not configured')
    return {
      status: 'error',
      message: 'Unable to build invite URL. Please try again later.',
    }
  }

  const result = await performEmployeeInvite({
    supabase,
    adminClient,
    siteUrl,
    createdBy: user.id,
    email,
    name,
    role,
  })

  if (result.status === 'success') {
    revalidatePath('/admin/employees')
  }

  return result
}

export default async function EmployeesAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee || employee.role !== 'admin') {
    redirect('/admin')
  }

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, name, email, role, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (employeesError) {
    console.error('[admin] employees load error:', employeesError)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Invite new employees and manage roles</p>
      </div>

      <Card id="invite-form">
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>Send an invite email with login instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteEmployeeForm action={inviteEmployee} initialState={INVITE_EMPLOYEE_INITIAL_STATE} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          {employeesError && (
            <p className="text-sm text-destructive">Unable to load team members right now.</p>
          )}
        </CardHeader>
        <CardContent>
          <EmployeesTableWrapper employees={employees || []} currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
