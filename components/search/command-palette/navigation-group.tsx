'use client'

import { CommandGroup, CommandItem } from '@/components/terra-flow/ui/command'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  CheckSquare,
  FileSignature,
  Shield,
  FileText,
} from 'lucide-react'

const navigationItems = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard, shortcut: 'G D' },
  { id: 'nav-leads', label: 'Leads', href: '/app/leads', icon: Users, shortcut: 'G L' },
  { id: 'nav-projects', label: 'Projects', href: '/app/projects', icon: Briefcase, shortcut: 'G P' },
  { id: 'nav-clients', label: 'Clients', href: '/app/clients', icon: UserCircle, shortcut: 'G C' },
  { id: 'nav-tasks', label: 'My Tasks', href: '/app/tasks', icon: CheckSquare, shortcut: 'G T' },
  { id: 'nav-proposals', label: 'Proposals', href: '/admin/proposals', icon: FileSignature, shortcut: 'G O' },
  { id: 'nav-team', label: 'Team', href: '/admin/employees', icon: Shield, shortcut: 'G M' },
  { id: 'nav-activity', label: 'Activity Log', href: '/admin/audit', icon: FileText, shortcut: 'G A' },
]

interface NavigationGroupProps {
  onSelect: (href: string) => void
}

export function NavigationGroup({ onSelect }: NavigationGroupProps) {
  return (
    <CommandGroup heading="Go to">
      {navigationItems.map(item => {
        const Icon = item.icon
        return (
          <CommandItem
            key={item.id}
            value={item.label}
            onSelect={() => onSelect(item.href)}
          >
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
