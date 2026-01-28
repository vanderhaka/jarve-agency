'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Mail, ExternalLink, Send } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { sendPortalLink } from './actions'

interface Project {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  client_id?: string | null
  clients?: { name: string; email: string } | null
}

interface Props {
  project: Project
  taskCounts: Record<string, number>
  totalTasks: number
  progress: number
  milestonesCount: number
  changeRequestsCount: number
}

export function AdminOverviewTab({
  project,
  taskCounts,
  totalTasks,
  progress,
  milestonesCount,
  changeRequestsCount,
}: Props) {
  const [sendingPortalLink, setSendingPortalLink] = useState(false)

  async function handleSendPortalLink() {
    setSendingPortalLink(true)
    try {
      const result = await sendPortalLink(project.id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to send portal link')
    } finally {
      setSendingPortalLink(false)
    }
  }
  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{project.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{project.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-medium capitalize ${
                project.status === 'planning' ? 'text-yellow-800' :
                project.status === 'active' ? 'text-green-800' :
                project.status === 'completed' ? 'text-blue-800' :
                project.status === 'maintenance' ? 'text-purple-800' :
                'text-gray-800'
              }`}>
                {project.status}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.clients && project.client_id ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{project.clients.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${project.clients.email}`} className="text-primary hover:underline">
                      {project.clients.email}
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/clients/${project.client_id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Client
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSendPortalLink}
                    disabled={sendingPortalLink}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingPortalLink ? 'Sending...' : 'Send Portal Link'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No client assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Progress</CardTitle>
          <CardDescription>Overview of tasks, milestones, and change requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{taskCounts['Done'] || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{milestonesCount}</div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{changeRequestsCount}</div>
              <div className="text-sm text-muted-foreground">Change Requests</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
