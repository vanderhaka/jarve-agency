import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock } from 'lucide-react'

interface ProposalVersion {
  id: string
  version: number
  content: unknown
  subtotal: number
  gst_rate: number
  gst_amount: number
  total: number
  sent_at: string | null
  created_at: string
  created_by_employee?: { name: string }
}

interface VersionHistoryProps {
  versions: ProposalVersion[]
  currentVersion: number
}

export function VersionHistory({ versions, currentVersion }: VersionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>
          Each edit creates a new version for tracking changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions
              .sort((a, b) => b.version - a.version)
              .map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    v{version.version}
                    {version.version === currentVersion && (
                      <Badge className="ml-2" variant="outline">
                        Current
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(version.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {version.created_by_employee?.name || '-'}
                  </TableCell>
                  <TableCell>${version.total?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {version.sent_at ? (
                      <Badge className="bg-blue-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Sent {new Date(version.sent_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Draft</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
