'use client'

import Link from 'next/link'
import { MessageSquare, FileText, Upload, ArrowRight } from 'lucide-react'
import { usePortal } from './portal-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PortalHomeProps {
  latestMessages: { author_type: string; body: string; created_at: string }[]
}

export function PortalHome({ latestMessages }: PortalHomeProps) {
  const { manifest, token, selectedProject } = usePortal()
  const basePath = `/portal/${token}`

  const totalUnread = manifest.projects.reduce((sum, p) => sum + p.unread_count, 0)

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {manifest.clientUser.name}
        </h1>
        <p className="text-muted-foreground">
          {manifest.client.company || manifest.client.name} Client Portal
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{manifest.projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnread}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {selectedProject?.name || 'None selected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProject?.status?.replace(/_/g, ' ') || 'No active project'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`${basePath}/chat`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                {totalUnread > 0 && (
                  <Badge variant="destructive">{totalUnread} new</Badge>
                )}
              </div>
              <CardTitle className="text-lg">Messages</CardTitle>
              <CardDescription>
                Chat with the team about your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto">
                View messages <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${basePath}/docs`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Documents</CardTitle>
              <CardDescription>
                View contracts, proposals, and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto">
                View documents <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${basePath}/uploads`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Uploads</CardTitle>
              <CardDescription>
                Share files and assets with the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto">
                Manage uploads <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Latest messages preview */}
      {latestMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest updates from your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestMessages.map((msg, idx) => (
              <div key={idx} className="flex gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    msg.author_type === 'owner' ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {msg.author_type === 'owner' ? 'JARVE Team' : 'You'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {msg.body}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            <Link href={`${basePath}/chat`}>
              <Button variant="outline" className="w-full">
                View all messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Projects list (if multiple) */}
      {manifest.projects.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>All your active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {manifest.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
