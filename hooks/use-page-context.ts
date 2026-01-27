'use client'

import { usePathname } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import {
  Briefcase,
  Mail,
  Archive,
  Trash2,
  RefreshCcw,
  FileSignature,
  CheckSquare,
  DollarSign,
  MessageSquare,
  Edit,
  Eye,
  type LucideIcon
} from 'lucide-react'

export type EntityType = 'lead' | 'client' | 'project' | 'employee' | 'proposal' | null

export interface PageContext {
  entityType: EntityType
  entityId: string | null
  entityName: string | null
  isDetailPage: boolean
  isListPage: boolean
}

export interface ContextualAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  action: string
  shortcut?: string
  destructive?: boolean
}

export interface RelatedItem {
  id: string
  name: string
  type: NonNullable<EntityType>
  subtitle?: string
  href: string
}

// Define actions available for each entity type
const ENTITY_ACTIONS: Record<NonNullable<EntityType>, ContextualAction[]> = {
  lead: [
    { id: 'convert-lead', label: 'Convert to Client', description: 'Create client and optionally project', icon: RefreshCcw, action: 'convert-lead' },
    { id: 'email-lead', label: 'Send Email', description: 'Open email client', icon: Mail, action: 'email-lead' },
    { id: 'edit-lead', label: 'Edit Lead', description: 'Update lead details', icon: Edit, action: 'edit-lead' },
    { id: 'archive-lead', label: 'Archive Lead', description: 'Move to archive', icon: Archive, action: 'archive-lead' },
    { id: 'delete-lead', label: 'Delete Lead', description: 'Permanently remove', icon: Trash2, action: 'delete-lead', destructive: true },
  ],
  client: [
    { id: 'new-project-client', label: 'New Project', description: 'Create project for this client', icon: Briefcase, action: 'new-project-client' },
    { id: 'new-proposal-client', label: 'New Proposal', description: 'Create proposal for this client', icon: FileSignature, action: 'new-proposal-client' },
    { id: 'email-client', label: 'Send Email', description: 'Open email client', icon: Mail, action: 'email-client' },
    { id: 'edit-client', label: 'Edit Client', description: 'Update client details', icon: Edit, action: 'edit-client' },
    { id: 'view-portal', label: 'View Portal', description: 'Open client portal', icon: Eye, action: 'view-portal' },
  ],
  project: [
    { id: 'new-task-project', label: 'New Task', description: 'Add task to project', icon: CheckSquare, action: 'new-task-project' },
    { id: 'new-milestone-project', label: 'New Milestone', description: 'Add billing milestone', icon: DollarSign, action: 'new-milestone-project' },
    { id: 'project-chat', label: 'Open Chat', description: 'Project messages', icon: MessageSquare, action: 'project-chat' },
    { id: 'edit-project', label: 'Edit Project', description: 'Update project details', icon: Edit, action: 'edit-project' },
    { id: 'archive-project', label: 'Archive Project', description: 'Move to archive', icon: Archive, action: 'archive-project' },
  ],
  employee: [
    { id: 'email-employee', label: 'Send Email', description: 'Open email client', icon: Mail, action: 'email-employee' },
    { id: 'view-tasks-employee', label: 'View Tasks', description: 'See assigned tasks', icon: CheckSquare, action: 'view-tasks-employee' },
    { id: 'edit-employee', label: 'Edit Employee', description: 'Update employee details', icon: Edit, action: 'edit-employee' },
  ],
  proposal: [
    { id: 'edit-proposal', label: 'Edit Proposal', description: 'Update proposal content', icon: Edit, action: 'edit-proposal' },
    { id: 'send-proposal', label: 'Send Proposal', description: 'Email to client', icon: Mail, action: 'send-proposal' },
    { id: 'duplicate-proposal', label: 'Duplicate', description: 'Create copy', icon: RefreshCcw, action: 'duplicate-proposal' },
  ],
}

// Route patterns for detecting entity context
const ROUTE_PATTERNS = {
  lead: {
    detail: /^\/(?:admin|app)\/leads\/([a-f0-9-]+)$/,
    list: /^\/(?:admin|app)\/leads$/,
  },
  client: {
    detail: /^\/(?:admin|app)\/clients\/([a-f0-9-]+)$/,
    list: /^\/(?:admin|app)\/clients$/,
  },
  project: {
    detail: /^\/(?:admin|app)\/projects\/([a-f0-9-]+)/,
    list: /^\/(?:admin|app)\/projects$/,
  },
  employee: {
    detail: /^\/admin\/employees\/([a-f0-9-]+)$/,
    list: /^\/admin\/employees$/,
  },
  proposal: {
    detail: /^\/admin\/proposals\/([a-f0-9-]+)$/,
    list: /^\/admin\/proposals$/,
  },
}

export function usePageContext() {
  const pathname = usePathname()
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)

  // Parse current route to determine context
  const context = useMemo((): PageContext => {
    if (!pathname) {
      return { entityType: null, entityId: null, entityName: null, isDetailPage: false, isListPage: false }
    }

    for (const [type, patterns] of Object.entries(ROUTE_PATTERNS)) {
      const detailMatch = pathname.match(patterns.detail)
      if (detailMatch) {
        return {
          entityType: type as EntityType,
          entityId: detailMatch[1],
          entityName: null, // Will be populated separately if needed
          isDetailPage: true,
          isListPage: false,
        }
      }

      if (patterns.list.test(pathname)) {
        return {
          entityType: type as EntityType,
          entityId: null,
          entityName: null,
          isDetailPage: false,
          isListPage: true,
        }
      }
    }

    return { entityType: null, entityId: null, entityName: null, isDetailPage: false, isListPage: false }
  }, [pathname])

  // Get contextual actions based on entity type
  const actions = useMemo((): ContextualAction[] => {
    if (!context.entityType || !context.isDetailPage) return []
    return ENTITY_ACTIONS[context.entityType] || []
  }, [context.entityType, context.isDetailPage])

  // Fetch related items when on a detail page
  useEffect(() => {
    async function fetchRelatedItems() {
      if (!context.entityType || !context.entityId || !context.isDetailPage) {
        setRelatedItems([])
        return
      }

      setIsLoadingRelated(true)
      try {
        const response = await fetch(
          `/api/related?type=${context.entityType}&id=${context.entityId}`
        )
        if (response.ok) {
          const data = await response.json()
          setRelatedItems(data.items || [])
        } else {
          setRelatedItems([])
        }
      } catch {
        setRelatedItems([])
      } finally {
        setIsLoadingRelated(false)
      }
    }

    fetchRelatedItems()
  }, [context.entityType, context.entityId, context.isDetailPage])

  return {
    ...context,
    actions,
    relatedItems,
    isLoadingRelated,
  }
}

// Hook to trigger contextual actions
export function useContextualActionHandler() {
  const context = usePageContext()

  const handleAction = (actionId: string) => {
    // Dispatch custom event with action and context
    window.dispatchEvent(
      new CustomEvent('contextual-action', {
        detail: {
          action: actionId,
          entityType: context.entityType,
          entityId: context.entityId,
        },
      })
    )
  }

  return { handleAction, context }
}
