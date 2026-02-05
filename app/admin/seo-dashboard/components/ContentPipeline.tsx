'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { FileText, Clock, Search, ExternalLink } from 'lucide-react'
import type { PseoStats } from '../types'

interface ContentPipelineProps {
  pseoStats: PseoStats
}

export default function ContentPipeline({ pseoStats }: ContentPipelineProps) {
  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-3">Content Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Published / Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pseoStats.published} / {pseoStats.total}
              </div>
              <Progress
                value={pseoStats.total > 0 ? (pseoStats.published / pseoStats.total) * 100 : 0}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {pseoStats.total > 0 ? Math.round((pseoStats.published / pseoStats.total) * 100) : 0}% complete
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Drip Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pseoStats.dripRate} pages/day</div>
              <p className="text-xs text-muted-foreground">{pseoStats.draft} pages remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Est. Completion</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pseoStats.estCompletionDate}</div>
              <p className="text-xs text-muted-foreground">{pseoStats.estDaysRemaining} days remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pseoStats.pagesRanking} / {pseoStats.publishedTotal}
              </div>
              <p className="text-xs text-muted-foreground">published pages in search results</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Pattern</TableHead>
                <TableHead className="text-right">Published</TableHead>
                <TableHead className="text-right">Draft</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(pseoStats.breakdown).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell className="text-right">{val.published}</TableCell>
                  <TableCell className="text-right">{val.draft}</TableCell>
                  <TableCell className="text-right">{val.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recently published pages */}
      {pseoStats.recentPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Published</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>URL Path</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pseoStats.recentPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.meta_title || page.slug}</TableCell>
                    <TableCell>
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        /{page.slug}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
