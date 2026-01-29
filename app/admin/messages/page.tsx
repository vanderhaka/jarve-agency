import { createAdminClient } from '@/utils/supabase/admin'
import { MessagesClient } from './messages-client'

export const dynamic = 'force-dynamic'

async function getUnreadConversations() {
  const supabase = createAdminClient()

  // Get all client messages with project info
  const { data: messages } = await supabase
    .from('portal_messages')
    .select(`
      id,
      project_id,
      body,
      created_at,
      author_type,
      agency_projects!inner(name)
    `)
    .eq('author_type', 'client')
    .order('created_at', { ascending: false })

  if (!messages || messages.length === 0) return []

  const projectIds = [...new Set(messages.map(m => m.project_id))]
  const { data: readStates } = await supabase
    .from('portal_read_state')
    .select('project_id, last_read_at')
    .eq('user_type', 'owner')
    .in('project_id', projectIds)

  const readMap = new Map(
    (readStates || []).map(rs => [rs.project_id, rs.last_read_at])
  )

  const projectMap = new Map<string, {
    projectName: string
    unreadCount: number
    latestMessageAt: string
    recentMessages: { id: string; body: string; createdAt: string }[]
  }>()

  for (const msg of messages) {
    const lastRead = readMap.get(msg.project_id)
    if (lastRead && new Date(msg.created_at) <= new Date(lastRead)) continue

    const existing = projectMap.get(msg.project_id)
    if (existing) {
      existing.unreadCount++
      if (existing.recentMessages.length < 5) {
        existing.recentMessages.push({
          id: msg.id,
          body: msg.body,
          createdAt: msg.created_at,
        })
      }
    } else {
      const project = msg.agency_projects as unknown as { name: string }
      projectMap.set(msg.project_id, {
        projectName: project.name,
        unreadCount: 1,
        latestMessageAt: msg.created_at,
        recentMessages: [{
          id: msg.id,
          body: msg.body,
          createdAt: msg.created_at,
        }],
      })
    }
  }

  return Array.from(projectMap.entries()).map(([projectId, data]) => ({
    projectId,
    ...data,
    recentMessages: data.recentMessages.reverse(),
  }))
}

export default async function MessagesPage() {
  const conversations = await getUnreadConversations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Unread client messages across projects</p>
      </div>
      <MessagesClient initialConversations={conversations} />
    </div>
  )
}
