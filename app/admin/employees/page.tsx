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

async function inviteEmployee(formData: FormData) {
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
    .single()

  if (employee?.role !== 'admin') {
    redirect('/app')
  }

  const email = (formData.get('email') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const role = (formData.get('role') as string) || DEFAULT_EMPLOYEE_ROLE

  if (!email || !name) {
    return
  }

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required')
  }
  const redirectTo = `${siteUrl}/auth/confirm?next=/login`

  const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: redirectTo,
  })

  if (error) {
    throw new Error(error.message)
  }

  const newUserId = inviteData.user?.id

  if (newUserId) {
    await adminClient
      .from('employees')
      .upsert({
        id: newUserId,
        email,
        name,
        role,
        created_by: user.id,
      })
  }

  revalidatePath('/admin/employees')
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
    .single()

  if (employee?.role !== 'admin') {
    redirect('/app')
  }

  const { data: employees } = await supabase
    .from('employees')
    .select('*')
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
