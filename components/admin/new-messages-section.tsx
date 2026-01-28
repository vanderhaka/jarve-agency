import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface UnreadProject {
  projectId: string
  projectName: string
  unreadCount: number
  latestMessageAt: string
}

export function NewMessagesSection({ projects }: { projects: UnreadProject[] }) {
  if (projects.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">New Messages</CardTitle>
            <CardDescription className="text-xs">Projects with unread client messages</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.projectId}
              href={`/admin/projects/${project.projectId}?tab=chat`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all group"
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{project.projectName}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {project.unreadCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(project.latestMessageAt), { addSuffix: true })}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
