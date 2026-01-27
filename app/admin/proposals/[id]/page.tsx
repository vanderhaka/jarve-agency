'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  History,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  updateProposal,
  sendProposal,
  archiveProposal,
  ProposalSection,
  PricingLineItem,
  ProposalContent
} from '../actions'

interface ClientUser {
  id: string
  name: string
  email: string
}

interface ProposalVersion {
  id: string
  version: number
  content: ProposalContent
  subtotal: number
  gst_rate: number
  gst_amount: number
  total: number
  sent_at: string | null
  created_at: string
  created_by_employee?: { name: string }
}

interface Proposal {
  id: string
  title: string
  status: string
  current_version: number
  created_at: string
  updated_at: string
  signed_at: string | null
  client_id: string | null
  lead_id: string | null
  project_id: string | null
  client?: { id: string; name: string }
  lead?: { id: string; name: string }
  project?: { id: string; name: string }
  versions: ProposalVersion[]
  signatures: Array<{
    id: string
    signer_name: string
    signer_email: string
    signed_at: string
    ip_address: string
  }>
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const proposalId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [content, setContent] = useState<ProposalContent | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([])
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedClientUserId, setSelectedClientUserId] = useState('')
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  const fetchProposal = useCallback(async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        client:clients(id, name),
        lead:leads(id, name),
        project:agency_projects(id, name),
        versions:proposal_versions(
          id, version, content, subtotal, gst_rate, gst_amount, total,
          sent_at, created_at,
          created_by_employee:employees(name)
        ),
        signatures:proposal_signatures(
          id, signer_name, signer_email, signed_at, ip_address
        )
      `)
      .eq('id', proposalId)
      .single()

    if (error || !data) {
      console.error('Error fetching proposal:', error)
      router.push('/admin/proposals')
      return
    }

    setProposal(data as Proposal)

    // Load current version content
    const currentVersion = data.versions?.find(
      (v: ProposalVersion) => v.version === data.current_version
    )
    if (currentVersion) {
      setContent(currentVersion.content as ProposalContent)
    }

    // Fetch client users if we have a client
    if (data.client_id) {
      const { data: users } = await supabase
        .from('client_users')
        .select('id, name, email')
        .eq('client_id', data.client_id)

      if (users) {
        setClientUsers(users)
      }
    }

    setLoading(false)
  }, [supabase, proposalId, router])

  useEffect(() => {
    void fetchProposal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Section handlers
  const updateSection = (sectionId: string, updates: Partial<ProposalSection>) => {
    if (!content) return
    setContent({
      ...content,
      sections: content.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    })
    setHasChanges(true)
  }

  const addSection = (type: ProposalSection['type']) => {
    if (!content) return
    const newSection: ProposalSection = {
      id: `section_${Date.now()}`,
      type,
      title: type === 'pricing' ? 'Investment' : 'New Section',
      body: '',
      items: type === 'list' ? [] : undefined,
      order: content.sections.length + 1
    }
    setContent({
      ...content,
      sections: [...content.sections, newSection]
    })
    setHasChanges(true)
  }

  const removeSection = (sectionId: string) => {
    if (!content) return
    setContent({
      ...content,
      sections: content.sections.filter(s => s.id !== sectionId)
    })
    setHasChanges(true)
  }

  // Pricing handlers
  const addLineItem = () => {
    if (!content) return
    const newItem: PricingLineItem = {
      id: crypto.randomUUID(),
      label: '',
      qty: 1,
      unitPrice: 0,
      total: 0
    }
    const newLineItems = [...content.pricing.lineItems, newItem]
    updatePricing(newLineItems)
  }

  const updateLineItem = (itemId: string, updates: Partial<PricingLineItem>) => {
    if (!content) return
    const newLineItems = content.pricing.lineItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        updated.total = updated.qty * updated.unitPrice
        return updated
      }
      return item
    })
    updatePricing(newLineItems)
  }

  const removeLineItem = (itemId: string) => {
    if (!content) return
    const newLineItems = content.pricing.lineItems.filter(i => i.id !== itemId)
    updatePricing(newLineItems)
  }

  const updatePricing = (lineItems: PricingLineItem[]) => {
    if (!content) return
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const gstAmount = subtotal * content.pricing.gstRate
    const total = subtotal + gstAmount

    setContent({
      ...content,
      pricing: {
        ...content.pricing,
        lineItems,
        subtotal,
        gstAmount,
        total
      }
    })
    setHasChanges(true)
  }

  const updateTerms = (terms: string) => {
    if (!content) return
    setContent({ ...content, terms })
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!content || !proposal) return
    setSaving(true)

    const result = await updateProposal(proposal.id, { content })

    if (result.success) {
      setHasChanges(false)
      fetchProposal()
    }

    setSaving(false)
  }

  // Send handler
  const handleSend = async () => {
    if (!proposal || !selectedClientUserId) return
    setSending(true)

    const result = await sendProposal(proposal.id, {
      clientUserId: selectedClientUserId
    })

    if (result.success) {
      setSendDialogOpen(false)
      fetchProposal()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setSending(false)
  }

  // Archive handler
  const handleArchive = async () => {
    if (!proposal) return
    if (!confirm('Are you sure you want to archive this proposal?')) return

    const result = await archiveProposal(proposal.id)
    if (result.success) {
      router.push('/admin/proposals')
    }
  }

  if (loading || !proposal || !content) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    signed: 'bg-green-500',
    archived: 'bg-orange-500',
  }

  const isSigned = proposal.status === 'signed'
  const isArchived = proposal.status === 'archived'
  const canEdit = !isSigned && !isArchived

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/proposals">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <Badge className={statusColors[proposal.status]}>
                {proposal.status}
              </Badge>
              <Badge variant="outline">v{proposal.current_version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {proposal.client?.name || proposal.lead?.name || 'No client linked'}
              {proposal.project && ` • ${proposal.project.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              {proposal.client_id ? (
                <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="h-4 w-4 mr-2" /> Send
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Proposal</DialogTitle>
                      <DialogDescription>
                        Select a client contact to send this proposal to.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Send to</Label>
                        <Select
                          value={selectedClientUserId}
                          onValueChange={setSelectedClientUserId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contact" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSendDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSend}
                        disabled={!selectedClientUserId || sending}
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button disabled title="Link a client to send this proposal">
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              )}
              <Button variant="ghost" onClick={handleArchive}>
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Signed banner */}
      {isSigned && proposal.signatures.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Signed by {proposal.signatures[0].signer_name}
                </p>
                <p className="text-sm text-green-700">
                  {proposal.signatures[0].signer_email} •{' '}
                  {new Date(proposal.signatures[0].signed_at).toLocaleString()} •{' '}
                  IP: {proposal.signatures[0].ip_address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-2">
            <History className="h-4 w-4" /> Versions ({proposal.versions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6 space-y-6">
          {/* Sections */}
          {content.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section.id, { title: e.target.value })
                      }
                      className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
                      disabled={!canEdit}
                    />
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {section.type === 'text' && (
                    <Textarea
                      value={section.body || ''}
                      onChange={(e) =>
                        updateSection(section.id, { body: e.target.value })
                      }
                      placeholder="Enter content..."
                      rows={4}
                      disabled={!canEdit}
                    />
                  )}
                  {section.type === 'list' && (
                    <div className="space-y-2">
                      {(section.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newItems = [...(section.items || [])]
                              newItems[idx] = e.target.value
                              updateSection(section.id, { items: newItems })
                            }}
                            disabled={!canEdit}
                          />
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newItems = (section.items || []).filter(
                                  (_, i) => i !== idx
                                )
                                updateSection(section.id, { items: newItems })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newItems = [...(section.items || []), '']
                            updateSection(section.id, { items: newItems })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                      )}
                    </div>
                  )}
                  {section.type === 'pricing' && (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Description</TableHead>
                            <TableHead className="w-[15%]">Qty</TableHead>
                            <TableHead className="w-[20%]">Unit Price</TableHead>
                            <TableHead className="w-[20%]">Total</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {content.pricing.lineItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  value={item.label}
                                  onChange={(e) =>
                                    updateLineItem(item.id, { label: e.target.value })
                                  }
                                  placeholder="Line item description"
                                  disabled={!canEdit}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateLineItem(item.id, {
                                      qty: parseFloat(e.target.value) || 0
                                    })
                                  }
                                  min="0"
                                  disabled={!canEdit}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateLineItem(item.id, {
                                      unitPrice: parseFloat(e.target.value) || 0
                                    })
                                  }
                                  min="0"
                                  step="0.01"
                                  disabled={!canEdit}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                ${item.total.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLineItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={addLineItem}>
                          <Plus className="h-4 w-4 mr-2" /> Add Line Item
                        </Button>
                      )}
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${content.pricing.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>GST ({(content.pricing.gstRate * 100).toFixed(0)}%):</span>
                            <span>${content.pricing.gstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>${content.pricing.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

          {/* Add Section */}
          {canEdit && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => addSection('text')}>
                    <Plus className="h-4 w-4 mr-2" /> Text Section
                  </Button>
                  <Button variant="outline" onClick={() => addSection('list')}>
                    <Plus className="h-4 w-4 mr-2" /> List Section
                  </Button>
                  {!content.sections.some((s) => s.type === 'pricing') && (
                    <Button variant="outline" onClick={() => addSection('pricing')}>
                      <Plus className="h-4 w-4 mr-2" /> Pricing Section
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content.terms}
                onChange={(e) => updateTerms(e.target.value)}
                placeholder="Enter payment terms, conditions, and other legal text..."
                rows={6}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                Each edit creates a new version for tracking changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposal.versions
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">
                          v{version.version}
                          {version.version === proposal.current_version && (
                            <Badge className="ml-2" variant="outline">
                              Current
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(version.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {version.created_by_employee?.name || '-'}
                        </TableCell>
                        <TableCell>${version.total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {version.sent_at ? (
                            <Badge className="bg-blue-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Sent {new Date(version.sent_at).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Draft</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
