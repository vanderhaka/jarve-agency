'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { Phone, Mail, Users, FileText, Plus } from 'lucide-react'

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note'
  description: string
  created_at: string
}

export function ClientActivityLog({ clientId }: { clientId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newActivity, setNewActivity] = useState('')
  const [type, setType] = useState<'call' | 'email' | 'meeting' | 'note'>('note')
  const supabase = createClient()

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (data) setActivities(data as Activity[])
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function addActivity() {
    if (!newActivity.trim()) return

    const { error } = await supabase.from('client_activities').insert({
      client_id: clientId,
      type,
      description: newActivity,
    })

    if (!error) {
      setNewActivity('')
      fetchActivities()
    }
  }

  const icons = {
    call: Phone,
    email: Mail,
    meeting: Users,
    note: FileText,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={type} onValueChange={(v: 'call' | 'email' | 'meeting' | 'note') => setType(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Log a call, note, or email..." 
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addActivity()}
            />
            <Button onClick={addActivity}>Log</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = icons[activity.type]
          return (
            <div key={activity.id} className="flex gap-4 items-start p-4 border rounded-lg bg-card">
              <div className={`p-2 rounded-full bg-muted`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
        {activities.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-8">
            No activity logged yet.
          </div>
        )}
      </div>
    </div>
  )
}



