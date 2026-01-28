'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Home, MessageSquare, FileText, Upload, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortal } from './portal-context'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { getPortalChatChannel, PORTAL_CHAT_EVENT } from '@/lib/integrations/portal/realtime'

interface Message {
  id: string
  project_id: string
  author_type: string
  body: string
  created_at: string
}

interface Doc {
  id: string
  title: string
  doc_type: string
  file_path: string | null
  created_at: string
  signed_at: string | null
}

interface UploadItem {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by_type: string
  created_at: string
}

interface PortalTabsProps {
  initialMessages: Message[]
  initialDocs: Doc[]
  initialUploads: UploadItem[]
  initialProjectId: string | null
  children: {
    overview: React.ReactNode
    messages: React.ReactNode
    documents: React.ReactNode
    uploads: React.ReactNode
    invoices: React.ReactNode
  }
}

type TabId = 'overview' | 'messages' | 'documents' | 'uploads' | 'invoices'

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
]

export function PortalTabs({ children }: PortalTabsProps) {
  const searchParams = useSearchParams()
  const { manifest, selectedProject, setProjectUnread, incrementProjectUnread } = usePortal()
  const supabase = useMemo(() => createClient(), [])

  // Get tab from URL query param or use state default
  const tabParam = searchParams.get('tab')
  const urlTab: TabId | null = tabParam && tabs.some((t) => t.id === tabParam)
    ? (tabParam as TabId)
    : null

  const [stateTab, setStateTab] = useState<TabId>('overview')

  // Use URL tab if present, otherwise use state tab
  const activeTab = urlTab ?? stateTab

  // When user clicks a tab, update state (URL param takes precedence if present)
  const setActiveTab = (tab: TabId) => {
    setStateTab(tab)
  }

  const totalUnread = manifest.projects.reduce((sum, p) => sum + p.unread_count, 0)
  const projectIdsKey = useMemo(
    () => manifest.projects.map((project) => project.id).join('|'),
    [manifest.projects]
  )
  const projectsRef = useRef(manifest.projects)
  const activeTabRef = useRef(activeTab)
  const selectedProjectRef = useRef(selectedProject)

  useEffect(() => {
    projectsRef.current = manifest.projects
  }, [manifest.projects])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    selectedProjectRef.current = selectedProject
  }, [selectedProject])

  useEffect(() => {
    const projects = projectsRef.current
    if (projects.length === 0) return

    const channels = projects.map((project) =>
      supabase
        .channel(getPortalChatChannel(project.id), {
          config: { broadcast: { self: true } },
        })
        .on('broadcast', { event: PORTAL_CHAT_EVENT }, ({ payload }) => {
          const incoming = (payload as { message?: Message }).message
          if (!incoming) return
          if (incoming.project_id !== project.id) return
          if (incoming.author_type !== 'owner') return

          const isActiveProject = selectedProjectRef.current?.id === project.id
          const isViewingMessages = activeTabRef.current === 'messages' && isActiveProject

          if (isViewingMessages) {
            setProjectUnread(project.id, 0)
          } else {
            incrementProjectUnread(project.id, 1)
          }
        })
    )

    channels.forEach((channel) => channel.subscribe())

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [projectIdsKey, supabase, setProjectUnread, incrementProjectUnread])

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="border-b">
        <nav className="flex gap-1" aria-label="Portal sections">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const showBadge = tab.id === 'messages' && totalUnread > 0

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                )}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {showBadge && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'overview' && children.overview}
        {activeTab === 'messages' && children.messages}
        {activeTab === 'documents' && children.documents}
        {activeTab === 'uploads' && children.uploads}
        {activeTab === 'invoices' && children.invoices}
      </div>
    </div>
  )
}
