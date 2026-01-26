'use client'

import { ChevronDown, Check } from 'lucide-react'
import { usePortal } from './portal-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ProjectSwitcher() {
  const { manifest, selectedProject, setSelectedProject } = usePortal()

  if (manifest.projects.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {selectedProject?.name || 'Select Project'}
          {selectedProject && selectedProject.unread_count > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {selectedProject.unread_count}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {manifest.projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{project.name}</span>
            <div className="flex items-center gap-2">
              {project.unread_count > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {project.unread_count}
                </Badge>
              )}
              {selectedProject?.id === project.id && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
