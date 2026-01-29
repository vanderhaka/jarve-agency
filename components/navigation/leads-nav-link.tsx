'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users } from 'lucide-react'
import { cn } from '@/lib/terra-flow/utils'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'

export function LeadsNavLink() {
  const pathname = usePathname()
  const isActive = pathname.startsWith('/admin/leads')
  const [hasNew, setHasNew] = useState(false)
  const [, startTransition] = useTransition()

  const fetchNew = useCallback(() => {
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new')
          .is('archived_at', null)
        setHasNew((count ?? 0) > 0)
      } catch {
        // ignore
      }
    })
  }, [])

  useEffect(() => {
    fetchNew()
  }, [fetchNew])

  // Poll every 30s for new leads (no realtime channel for leads yet)
  useEffect(() => {
    const interval = setInterval(fetchNew, 30_000)
    return () => clearInterval(interval)
  }, [fetchNew])

  // Re-check when navigating back from leads (user may have changed statuses)
  useEffect(() => {
    fetchNew()
  }, [pathname, fetchNew])

  return (
    <Link
      href="/admin/leads"
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 relative',
        isActive
          ? 'bg-gray-900 text-white shadow dark:bg-white dark:text-gray-900'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <span className="relative">
        <Users className="h-4 w-4" />
        {hasNew && (
          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
        )}
      </span>
      Leads
    </Link>
  )
}
