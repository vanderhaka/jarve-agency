'use client'

import { NewLeadDialog } from '@/components/new-lead-dialog'
import { NewClientDialog } from '@/components/new-client-dialog'
import { NewProjectDialog } from '@/components/new-project-dialog'

interface ActionDialogsProps {
  leadDialogOpen: boolean
  clientDialogOpen: boolean
  projectDialogOpen: boolean
  onLeadOpenChange: (open: boolean) => void
  onClientOpenChange: (open: boolean) => void
  onProjectOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ActionDialogs({
  leadDialogOpen,
  clientDialogOpen,
  projectDialogOpen,
  onLeadOpenChange,
  onClientOpenChange,
  onProjectOpenChange,
  onSuccess,
}: ActionDialogsProps) {
  return (
    <>
      <NewLeadDialog
        open={leadDialogOpen}
        onOpenChange={onLeadOpenChange}
        onSuccess={onSuccess}
        trigger={null}
      />
      <NewClientDialog
        open={clientDialogOpen}
        onOpenChange={onClientOpenChange}
        onSuccess={onSuccess}
        trigger={null}
      />
      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={onProjectOpenChange}
        onSuccess={onSuccess}
        trigger={null}
      />
    </>
  )
}
