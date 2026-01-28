'use client'

import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { PortalManifest, PortalProject } from '@/lib/integrations/portal'

interface PortalContextType {
  manifest: PortalManifest
  token: string
  selectedProject: PortalProject | null
  setSelectedProject: (project: PortalProject | null) => void
  setProjectUnread: (projectId: string, count: number) => void
  incrementProjectUnread: (projectId: string, delta?: number) => void
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
  const [manifestState, setManifestState] = useState<PortalManifest>(manifest)
  // Track selected project by ID, derive full project from manifestState
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    manifest.projects[0]?.id || null
  )

  // Derive selectedProject from manifestState to stay in sync with unread counts
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null
    return manifestState.projects.find((p) => p.id === selectedProjectId) || null
  }, [manifestState.projects, selectedProjectId])

  const setSelectedProject = (project: PortalProject | null) => {
    setSelectedProjectId(project?.id || null)
  }

  const setProjectUnread = (projectId: string, count: number) => {
    setManifestState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? { ...project, unread_count: Math.max(0, count) }
          : project
      ),
    }))
  }

  const incrementProjectUnread = (projectId: string, delta: number = 1) => {
    setManifestState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? { ...project, unread_count: Math.max(0, project.unread_count + delta) }
          : project
      ),
    }))
  }

  return (
    <PortalContext.Provider
      value={{
        manifest: manifestState,
        token,
        selectedProject,
        setSelectedProject,
        setProjectUnread,
        incrementProjectUnread,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}
