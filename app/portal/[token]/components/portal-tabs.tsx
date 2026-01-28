'use client'

import { useState } from 'react'
import { Home, MessageSquare, FileText, Upload, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortal } from './portal-context'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
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
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const { manifest } = usePortal()

  const totalUnread = manifest.projects.reduce((sum, p) => sum + p.unread_count, 0)

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
