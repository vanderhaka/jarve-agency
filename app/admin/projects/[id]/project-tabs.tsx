'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList, Receipt } from 'lucide-react'

interface Props {
  currentTab: 'tasks' | 'finance'
}

export function ProjectTabs({ currentTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setTab = (tab: 'tasks' | 'finance') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Keep view param only for tasks tab
    if (tab === 'finance') {
      params.delete('view')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setTab('tasks')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
            currentTab === 'tasks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Tasks
        </button>
        <button
          onClick={() => setTab('finance')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
            currentTab === 'finance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Finance
        </button>
      </nav>
    </div>
  )
}
