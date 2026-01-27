'use client'

import { CommandGroup, CommandItem } from '@/components/terra-flow/ui/command'
import {
  Users,
  UserCircle,
  Briefcase,
  FileSignature,
  Plus,
} from 'lucide-react'

const quickActions = {
  create: [
    { id: 'new-lead', label: 'New Lead', icon: Users, action: 'create-lead', shortcut: 'L' },
    { id: 'new-client', label: 'New Client', icon: UserCircle, action: 'create-client', shortcut: 'C' },
    { id: 'new-project', label: 'New Project', icon: Briefcase, action: 'create-project', shortcut: 'P' },
    { id: 'new-proposal', label: 'New Proposal', href: '/admin/proposals/new', icon: FileSignature, shortcut: 'O' },
  ],
}

interface QuickActionsProps {
  showCreateMode: boolean
  onAction: (action: string) => void
  onSelect: (href: string) => void
}

export function QuickActions({ showCreateMode, onAction, onSelect }: QuickActionsProps) {
  return (
    <CommandGroup heading={showCreateMode ? 'Create New' : 'Create'}>
      {quickActions.create.map(item => {
        const Icon = item.icon
        return (
          <CommandItem
            key={item.id}
            value={item.label}
            onSelect={() => item.href ? onSelect(item.href) : onAction(item.action!)}
          >
            <div className="mr-2 h-6 w-6 rounded-md bg-muted flex items-center justify-center">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{item.label}</span>
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
              {item.shortcut}
            </kbd>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
