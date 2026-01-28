'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, UserCircle, Briefcase, FileSignature } from 'lucide-react'
import { useState } from 'react'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { NewClientDialog } from '@/components/new-client-dialog'
import { NewProjectDialog } from '@/components/new-project-dialog'

export function CreateNewTabs() {
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  const actions = [
    {
      icon: Users,
      label: 'Lead',
      shortcut: '⌘K → L',
      onClick: () => setLeadDialogOpen(true),
    },
    {
      icon: UserCircle,
      label: 'Client',
      shortcut: '⌘K → C',
      onClick: () => setClientDialogOpen(true),
    },
    {
      icon: Briefcase,
      label: 'Project',
      shortcut: '⌘K → P',
      onClick: () => setProjectDialogOpen(true),
    },
    {
      icon: FileSignature,
      label: 'Proposal',
      shortcut: '⌘K → O',
      href: '/admin/proposals/new',
    },
  ]

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-white p-2">
        <span className="text-sm font-medium px-2 text-muted-foreground">Create New:</span>
        <div className="flex items-center gap-2 flex-1">
          {actions.map((action) => {
            const Icon = action.icon
            const content = (
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                  {action.shortcut}
                </span>
              </div>
            )

            if (action.href) {
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer"
                  asChild
                >
                  <Link href={action.href}>{content}</Link>
                </Button>
              )
            }

            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-9 px-3 border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer"
                onClick={action.onClick}
              >
                {content}
              </Button>
            )
          })}
        </div>
      </div>

      <NewLeadDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        trigger={null}
      />
      <NewClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        trigger={null}
      />
      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        trigger={null}
      />
    </>
  )
}
