'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createProposal } from '../actions'

interface Template {
  id: string
  name: string
  is_default: boolean
}

interface Lead {
  id: string
  name: string
  email: string
  company?: string
}

interface Project {
  id: string
  name: string
  client_id: string
  client?: { name: string }
}

export default function NewProposalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')
  const projectId = searchParams.get('projectId')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [templates, setTemplates] = useState<Template[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [title, setTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '')
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [templatesRes, leadsRes, projectsRes] = await Promise.all([
        supabase
          .from('proposal_templates')
          .select('id, name, is_default')
          .order('is_default', { ascending: false }),
        supabase
          .from('leads')
          .select('id, name, email, company')
          .is('archived_at', null)
          .order('name'),
        supabase
          .from('agency_projects')
          .select('id, name, client_id, client:clients(name)')
          .order('name')
      ])

      if (templatesRes.data) {
        setTemplates(templatesRes.data)
        const defaultTemplate = templatesRes.data.find(t => t.is_default)
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id)
        }
      }

      if (leadsRes.data) setLeads(leadsRes.data)
      if (projectsRes.data) setProjects(projectsRes.data as Project[])

      // If leadId is provided, get lead name for title
      if (leadId && leadsRes.data) {
        const lead = leadsRes.data.find(l => l.id === leadId)
        if (lead) {
          setTitle(`Proposal for ${lead.name}`)
        }
      }

      // If projectId is provided, get project name for title
      if (projectId && projectsRes.data) {
        const project = projectsRes.data.find((p: Project) => p.id === projectId)
        if (project) {
          setTitle(`Proposal for ${project.name}`)
        }
      }

      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!title.trim()) {
      setError('Please enter a proposal title')
      setSubmitting(false)
      return
    }

    const result = await createProposal({
      title: title.trim(),
      templateId: selectedTemplateId || undefined,
      leadId: selectedLeadId || undefined,
      projectId: selectedProjectId || undefined
    })

    if (result.success && result.proposalId) {
      router.push(`/admin/proposals/${result.proposalId}`)
    } else {
      setError(result.message)
      setSubmitting(false)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/proposals">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">New Proposal</h1>
        <p className="text-muted-foreground">Create a new proposal for a client or lead</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>Proposal Details</CardTitle>
              <CardDescription>Set up your new proposal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Website Redesign Proposal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.is_default ? '(Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose a template to pre-fill sections
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead">Link to Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} {lead.company ? `(${lead.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Link to Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} {project.client?.name ? `(${project.client.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  'Create Proposal'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
