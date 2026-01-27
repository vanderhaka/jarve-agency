'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical, Send, Archive, Trash2, Edit, ExternalLink, Copy, Check } from 'lucide-react'
import type { ChangeRequest, ChangeRequestStatus } from '@/lib/change-requests/types'

const statusColors: Record<ChangeRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-100 text-slate-800',
}

const statusLabels: Record<ChangeRequestStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting Signature',
  signed: 'Signed',
  rejected: 'Rejected',
  archived: 'Archived',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Props {
  changeRequest: ChangeRequest
  onEdit: (cr: ChangeRequest) => void
  onDelete: (crId: string) => void
  onSend: (crId: string) => void
  onArchive: (crId: string) => void
  disabled?: boolean
}

export function RequestCard({ changeRequest: cr, onEdit, onDelete, onSend, onArchive, disabled }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyPortalLink = (cr: ChangeRequest) => {
    if (!cr.portal_token) return
    const link = `${window.location.origin}/portal/change-request/${cr.portal_token}`
    navigator.clipboard.writeText(link)
    setCopiedId(cr.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{cr.title}</span>
        </div>
        {cr.description && (
          <p className="text-sm text-muted-foreground truncate">{cr.description}</p>
        )}
        {cr.status === 'signed' && cr.signer_name && (
          <p className="text-xs text-muted-foreground mt-1">
            Signed by {cr.signer_name} on {formatDate(cr.signed_at)}
          </p>
        )}
        {cr.status === 'rejected' && cr.rejection_reason && (
          <p className="text-xs text-destructive mt-1">
            Rejected: {cr.rejection_reason}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="font-medium">{formatCurrency(Number(cr.amount))}</div>
        <div className="text-xs text-muted-foreground">
          + {formatCurrency(Number(cr.amount) * 0.10)} GST
        </div>
      </div>
      <div className="text-sm text-muted-foreground w-24">
        {formatDate(cr.created_at)}
      </div>
      <Badge className={statusColors[cr.status]}>
        {statusLabels[cr.status]}
      </Badge>
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {cr.status === 'draft' && (
              <>
                <DropdownMenuItem onClick={() => onEdit(cr)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSend(cr.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send for Signature
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(cr.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {cr.status === 'sent' && cr.portal_token && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem onClick={() => copyPortalLink(cr)}>
                      {copiedId === cr.id ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedId === cr.id ? 'Copied!' : 'Copy Portal Link'}
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    Copy the signing link to share with the client
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuItem asChild>
                  <a
                    href={`/portal/change-request/${cr.portal_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Portal
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchive(cr.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </>
            )}
            {(cr.status === 'signed' || cr.status === 'rejected') && (
              <DropdownMenuItem onClick={() => onArchive(cr.id)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  )
}
