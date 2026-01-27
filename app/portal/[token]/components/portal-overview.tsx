'use client'

import { usePortal } from './portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Message {
  author_type: string
  body: string
  created_at: string
}

interface PortalOverviewProps {
  latestMessages: Message[]
}

export function PortalOverview({ latestMessages }: PortalOverviewProps) {
  const { manifest, selectedProject } = usePortal()

  const totalUnread = manifest.projects.reduce((sum, p) => sum + p.unread_count, 0)
  const hasProject = selectedProject !== null
  const projectName = selectedProject?.name
  const projectStatus = selectedProject?.status?.replace(/_/g, ' ')

  return (
    <div className="space-y-6">
      {/* Project status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Status</CardTitle>
          <CardDescription>
            {hasProject ? projectName : 'Select a project to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline">
                {hasProject ? projectStatus : 'No project'}
              </Badge>
            </div>
            {totalUnread > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Unread:</span>
                <Badge variant="destructive">{totalUnread} messages</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent messages preview */}
      {latestMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest messages from your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestMessages.map((msg, idx) => (
              <div key={idx} className="flex gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    msg.author_type === 'owner' ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {msg.author_type === 'owner' ? 'JARVE Team' : 'You'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {msg.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects list (if multiple) */}
      {manifest.projects.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Projects</CardTitle>
            <CardDescription>Switch between your active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {manifest.projects.map((project) => {
                const isSelected = selectedProject?.id === project.id
                return (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.status?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {project.unread_count > 0 && (
                      <Badge variant="destructive">
                        {project.unread_count} unread
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no projects */}
      {manifest.projects.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No active projects yet. Your projects will appear here once they begin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
