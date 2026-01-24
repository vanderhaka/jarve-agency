'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { PortalManifest, PortalProject } from '@/lib/integrations/portal'

interface PortalContextType {
  manifest: PortalManifest
  token: string
  selectedProject: PortalProject | null
  setSelectedProject: (project: PortalProject | null) => void
}

const PortalContext = createContext<PortalContextType | null>(null)

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}

interface PortalProviderProps {
  children: ReactNode
  manifest: PortalManifest
  token: string
}

export function PortalProvider({ children, manifest, token }: PortalProviderProps) {
  // Default to first project if available
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(
    manifest.projects[0] || null
  )

  return (
    <PortalContext.Provider
      value={{
        manifest,
        token,
        selectedProject,
        setSelectedProject,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}
