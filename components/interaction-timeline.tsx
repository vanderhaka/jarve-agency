'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface InteractionTimelineProps {
  leadId?: string
  clientId?: string
}

interface Interaction {
  id: string
  type: string
  summary: string
  next_steps: string | null
  created_at: string
  created_by_name: string | null
}

const types = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
]

export function InteractionTimeline({ leadId, clientId }: InteractionTimelineProps) {
  const supabase = createClient()
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<{ id: string; name: string } | null>(null)
  const [formState, setFormState] = useState({
    type: 'call',
    summary: '',
    next_steps: '',
  })

  const fetchCurrentEmployee = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('id', userId)
      .single()

    if (data) {
      setCurrentEmployee({ id: data.id, name: data.name })
    }
  }

  const fetchInteractions = async () => {
    setLoading(true)
    const query = supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (leadId) query.eq('lead_id', leadId)
    if (clientId) query.eq('client_id', clientId)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching interactions:', error)
    } else if (data) {
      setInteractions(data as Interaction[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCurrentEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchInteractions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, clientId])

  async function handleCreateInteraction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formState.summary.trim()) return

    setCreating(true)
    const { error } = await supabase.from('interactions').insert({
      type: formState.type,
      summary: formState.summary,
      next_steps: formState.next_steps || null,
      lead_id: leadId,
      client_id: clientId,
      created_by: currentEmployee?.id,
      created_by_name: currentEmployee?.name || null,
    })

    if (error) {
      console.error('Error creating interaction:', error)
      alert('Failed to log interaction')
    } else {
      setFormState({ type: formState.type, summary: '', next_steps: '' })
      fetchInteractions()
    }
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Internal Note</CardTitle>
          <CardDescription>Record internal notes about calls, meetings, and follow-ups (not visible to clients)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInteraction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  placeholder="e.g. Called client to discuss scope"
                  value={formState.summary}
                  onChange={(e) => setFormState((prev) => ({ ...prev, summary: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextSteps">Next Steps</Label>
              <Textarea
                id="nextSteps"
                value={formState.next_steps}
                onChange={(e) => setFormState((prev) => ({ ...prev, next_steps: e.target.value }))}
                rows={3}
                placeholder="Follow up with proposal draft..."
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving
                </>
              ) : (
                'Add Interaction'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading interactions...
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No interactions yet.</div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="border-l-2 border-border pl-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{interaction.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(interaction.created_at), 'MMM d, yyyy h:mma')}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {interaction.summary}
                  </p>
                  {interaction.next_steps && (
                    <div className="mt-2 text-sm">
                      <span className="font-semibold">Next Steps:</span>{' '}
                      <span>{interaction.next_steps}</span>
                    </div>
                  )}
                  {interaction.created_by_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Logged by {interaction.created_by_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
