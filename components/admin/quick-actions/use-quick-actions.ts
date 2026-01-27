'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuickActionsState {
  leadDialogOpen: boolean
  clientDialogOpen: boolean
  projectDialogOpen: boolean
  setLeadDialogOpen: (open: boolean) => void
  setClientDialogOpen: (open: boolean) => void
  setProjectDialogOpen: (open: boolean) => void
  handleSuccess: () => void
}

export function useQuickActions(): QuickActionsState {
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

  return {
    leadDialogOpen,
    clientDialogOpen,
    projectDialogOpen,
    setLeadDialogOpen,
    setClientDialogOpen,
    setProjectDialogOpen,
    handleSuccess,
  }
}
