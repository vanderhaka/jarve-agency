'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GripVertical, MoreVertical, Edit, Check, Receipt, Trash2 } from 'lucide-react'
import type { Milestone } from '@/lib/milestones/types'
import { statusColors, statusLabels, formatCurrency, formatDate } from './types'

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  onEdit: (milestone: Milestone) => void
  onComplete: (milestoneId: string) => void
  onDelete: (milestoneId: string) => void
}

export function MilestoneCard({
  milestone,
  index,
  onEdit,
  onComplete,
  onDelete,
}: MilestoneCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="text-muted-foreground cursor-grab">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="text-sm text-muted-foreground w-8">
        #{index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{milestone.title}</span>
          {milestone.is_deposit && (
            <Badge variant="outline" className="text-xs">Deposit</Badge>
          )}
        </div>
        {milestone.description && (
          <p className="text-sm text-muted-foreground truncate">{milestone.description}</p>
        )}
      </div>
      <div className="text-right">
        <div className="font-medium">{formatCurrency(Number(milestone.amount))}</div>
        <div className="text-xs text-muted-foreground">
          + {formatCurrency(Number(milestone.amount) * 0.10)} GST
        </div>
      </div>
      <div className="text-sm text-muted-foreground w-24">
        {formatDate(milestone.due_date)}
      </div>
      <Badge className={statusColors[milestone.status]}>
        {statusLabels[milestone.status]}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(milestone)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          {milestone.status !== 'complete' && milestone.status !== 'invoiced' && (
            <DropdownMenuItem onClick={() => onComplete(milestone.id)}>
              <Check className="h-4 w-4 mr-2" />
              Mark Complete
            </DropdownMenuItem>
          )}
          {milestone.invoice_id && (
            <DropdownMenuItem>
              <Receipt className="h-4 w-4 mr-2" />
              View Invoice
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onDelete(milestone.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
