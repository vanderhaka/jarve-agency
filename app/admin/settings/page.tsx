'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, UserCircle, Plus, ArrowRight, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AgencySettingsCard } from '@/components/agency-settings-card'
import { XeroConnectionCard } from '@/components/xero-connection-card'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<Array<{
    id: string
    name: string
    sections?: unknown[]
    is_default?: boolean
    updated_at: string
  }>>([])
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
  })
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
    setLoading(false)
  }

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('proposal_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching templates:', error)
      return
    }

    setTemplates(data || [])
  }

  useEffect(() => {
    fetchProfile()
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('employees')
      .update({ name: profile.name })
      .eq('id', profile.id)

    setSaving(false)
    if (!error) {
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and agency preferences</p>
      </div>

      <AgencySettingsCard />

      <XeroConnectionCard />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>Proposal Templates</CardTitle>
              <CardDescription>Manage your proposal templates</CardDescription>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/proposals/templates/new">
              <Plus className="mr-2 h-4 w-4" /> New Template
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No templates yet
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/proposals/templates/${template.id}`}
                        className="hover:underline text-primary"
                      >
                        {template.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(template.sections) ? template.sections.length : 0} sections
                    </TableCell>
                    <TableCell>
                      {template.is_default ? (
                        <Badge className="bg-primary">Default</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/proposals/templates/${template.id}`}>
                          Edit <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={profile.role} disabled className="capitalize bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
