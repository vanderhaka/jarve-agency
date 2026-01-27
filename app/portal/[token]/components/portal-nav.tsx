'use client'

import Link from 'next/link'
import { usePortal } from './portal-context'
import { ProjectSwitcher } from './project-switcher'

export function PortalNav() {
  const { manifest, token, selectedProject } = usePortal()
  const basePath = `/portal/${token}`

  const hasMultipleProjects = manifest.projects.length > 1

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Client name */}
          <Link href={basePath} className="font-semibold text-lg">
            {manifest.client.company ?? manifest.client.name}
          </Link>

          {/* Project context */}
          <div className="flex items-center gap-3">
            {hasMultipleProjects ? (
              <ProjectSwitcher />
            ) : selectedProject ? (
              <span className="text-sm text-muted-foreground">
                {selectedProject.name}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
