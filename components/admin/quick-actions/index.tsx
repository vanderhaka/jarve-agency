'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
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
    </>
  )
}
