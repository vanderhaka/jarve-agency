'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NewLeadDialog } from '@/components/new-lead-dialog'
import { NewClientDialog } from '@/components/new-client-dialog'
import { NewProjectDialog } from '@/components/new-project-dialog'
import {
  Users,
  UserCircle,
  Briefcase,
  Plus,
  FileSignature,
  CheckSquare,
  Mail,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsGridProps {
  stats?: {
    newLeads?: number
    openTasks?: number
    pendingProposals?: number
    overdueTasksCount?: number
  }
}

export function QuickActionsGrid({ stats }: QuickActionsGridProps) {
  const router = useRouter()
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  // Listen for command palette actions
  useEffect(() => {
    function handleCommandAction(event: CustomEvent<{ action: string }>) {
      switch (event.detail.action) {
        case 'create-lead':
          setLeadDialogOpen(true)
          break
        case 'create-client':
          setClientDialogOpen(true)
          break
        case 'create-project':
          setProjectDialogOpen(true)
          break
      }
    }

    window.addEventListener('command-palette-action', handleCommandAction as EventListener)
    return () => {
      window.removeEventListener('command-palette-action', handleCommandAction as EventListener)
    }
  }, [])

  const handleSuccess = () => {
    router.refresh()
  }

  const smartViews = [
    {
      id: 'new-leads',
      label: 'New Leads',
      description: 'Uncontacted leads awaiting response',
      icon: Mail,
      href: '/app/leads?status=new',
      count: stats?.newLeads,
    },
    {
      id: 'my-tasks',
      label: 'My Tasks',
      description: 'Open tasks assigned to you',
      icon: CheckSquare,
      href: '/app/tasks',
      count: stats?.openTasks,
    },
    {
      id: 'pending-proposals',
      label: 'Pending Proposals',
      description: 'Proposals awaiting client response',
      icon: FileSignature,
      href: '/admin/proposals?status=pending',
      count: stats?.pendingProposals,
    },
    {
      id: 'overdue-tasks',
      label: 'Overdue',
      description: 'Tasks past their due date',
      icon: AlertCircle,
      href: '/app/tasks?due=overdue',
      count: stats?.overdueTasksCount,
      urgent: (stats?.overdueTasksCount ?? 0) > 0,
    },
  ]

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create New Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Create New</CardTitle>
                <CardDescription className="text-xs">Start something new</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {/* New Lead */}
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
                onClick={() => setLeadDialogOpen(true)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm">New Lead</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘K → L
                </span>
              </Button>

              {/* New Client */}
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
                onClick={() => setClientDialogOpen(true)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm">New Client</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘K → C
                </span>
              </Button>

              {/* New Project */}
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
                onClick={() => setProjectDialogOpen(true)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm">New Project</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘K → P
                </span>
              </Button>

              {/* New Proposal */}
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
                asChild
              >
                <Link href="/admin/proposals/new">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
                      <FileSignature className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm">New Proposal</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
                    ⌘K → O
                  </span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Smart Views Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Quick Views</CardTitle>
                <CardDescription className="text-xs">Jump to filtered views</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {smartViews.map((view) => {
                const Icon = view.icon
                return (
                  <Link
                    key={view.id}
                    href={view.href}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all group',
                      view.urgent && 'bg-destructive/5 hover:bg-destructive/10'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 bg-muted',
                      view.urgent && 'bg-destructive/10'
                    )}>
                      <Icon className={cn(
                        'h-4 w-4 text-muted-foreground',
                        view.urgent && 'text-destructive'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{view.label}</span>
                        {view.count !== undefined && view.count > 0 && (
                          <span className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground',
                            view.urgent && 'bg-destructive/20 text-destructive'
                          )}>
                            {view.count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{view.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs - controlled mode with no trigger */}
      <NewLeadDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        onSuccess={handleSuccess}
        trigger={null}
      />
      <NewClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleSuccess}
        trigger={null}
      />
      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onSuccess={handleSuccess}
        trigger={null}
      />
    </>
  )
}
