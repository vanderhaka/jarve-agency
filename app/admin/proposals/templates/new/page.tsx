'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { createTemplate } from '../../template-actions'
import { ProposalSection } from '../../actions'

export default function NewTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [sections, setSections] = useState<ProposalSection[]>([])
  const [defaultTerms, setDefaultTerms] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    setSaving(true)
    setError(null)

    const result = await createTemplate({
      name,
      sections,
      defaultTerms: defaultTerms || undefined,
      isDefault
    })

    if (result.success) {
      router.push('/admin/proposals')
    } else {
      setError(result.message)
    }
    setSaving(false)
  }

  const addSection = () => {
    const newSection: ProposalSection = {
      id: crypto.randomUUID(),
      type: 'text',
      title: 'New Section',
      body: '',
      order: sections.length
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, updates: Partial<ProposalSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id))
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return

    const newSections = [...sections]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]]
    newSections.forEach((s, i) => s.order = i)
    setSections(newSections)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/proposals" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold">New Template</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" /> {saving ? 'Creating...' : 'Create Template'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Project Proposal"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="isDefault">Set as default template</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sections</CardTitle>
          <Button size="sm" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sections yet. Add a section to get started.
            </p>
          ) : (
            sections.sort((a, b) => a.order - b.order).map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Section {index + 1}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                    >
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === sections.length - 1}
                    >
                      Down
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Section title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={section.type}
                      onChange={(e) => updateSection(section.id, { type: e.target.value as ProposalSection['type'] })}
                    >
                      <option value="text">Text</option>
                      <option value="list">List</option>
                      <option value="pricing">Pricing</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {section.type === 'text' && (
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={section.body || ''}
                      onChange={(e) => updateSection(section.id, { body: e.target.value })}
                      placeholder="Section content..."
                      rows={4}
                    />
                  </div>
                )}

                {section.type === 'list' && (
                  <div className="space-y-2">
                    <Label>Items (one per line)</Label>
                    <Textarea
                      value={(section.items || []).join('\n')}
                      onChange={(e) => updateSection(section.id, { items: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Item 1&#10;Item 2&#10;Item 3"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={defaultTerms}
            onChange={(e) => setDefaultTerms(e.target.value)}
            placeholder="Enter default terms and conditions that will be included in proposals using this template..."
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  )
}
