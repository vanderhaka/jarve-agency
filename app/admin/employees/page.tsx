import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

const DEFAULT_EMPLOYEE_ROLE = 'employee'

async function inviteEmployee(formData: FormData): Promise<void> {
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
    redirect('/app')
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string)
  const effectiveRole = role ? role : DEFAULT_EMPLOYEE_ROLE

  // Validate inputs
  if (!email || !name) {
    console.error('[inviteEmployee] Missing email or name')
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error('[inviteEmployee] Invalid email format:', email)
    return
  }

  // Validate role
  if (effectiveRole !== 'employee' && effectiveRole !== 'admin') {
    console.error('[inviteEmployee] Invalid role:', effectiveRole)
    return
  }

  // Check if email is already registered using database function
  const { data: emailCheck } = await supabase.rpc('check_email_available', { p_email: email })
  if (emailCheck && !emailCheck.available) {
    console.error('[inviteEmployee] Email not available:', emailCheck.reason)
    return
  }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    console.error('[inviteEmployee] NEXT_PUBLIC_SITE_URL not configured')
    return
  }
  const redirectTo = `${siteUrl}/auth/confirm?next=/login`

  try {
    // Send invite via Supabase Auth
    const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: redirectTo,
    })

    if (error) {
      console.error('[inviteEmployee] Auth invite error:', error)
      return
    }

    const newUserId = inviteData.user?.id

    if (!newUserId) {
      console.error('[inviteEmployee] No user ID returned from invite')
      return
    }

    // Use safe database function to create employee record
    const { data: result, error: dbError } = await supabase.rpc('create_employee_record', {
      p_user_id: newUserId,
      p_email: email,
      p_name: name,
      p_role: effectiveRole,
      p_created_by: user.id,
    })

    if (dbError || (result && !result.success)) {
      // Employee record creation failed - log but don't fail the invite
      // The user can still accept the invite and their record will be created
      console.error('[inviteEmployee] Employee record error:', dbError, result?.error)
    }

    revalidatePath('/admin/employees')
  } catch (err) {
    console.error('[inviteEmployee] Unexpected error:', err)
  }
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
    redirect('/app')
  }

  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Invite new employees and manage roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Employee</CardTitle>
          <CardDescription>Send an invite email with login instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteEmployee} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                defaultValue={DEFAULT_EMPLOYEE_ROLE}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit">Send Invite</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!employees || employees.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No team members yet.
                  </TableCell>
                </TableRow>
              )}
              {employees?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name || 'Pending'}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
