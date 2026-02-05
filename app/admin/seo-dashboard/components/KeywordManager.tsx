'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { TrackedKeyword, Site } from '../types'

interface KeywordManagerProps {
  trackedKeywords: TrackedKeyword[]
  sites: Site[]
  newKeywords: string
  setNewKeywords: (value: string) => void
  addingSiteId: string
  setAddingSiteId: (value: string) => void
  saving: boolean
  onAddKeywords: () => void
  onDeleteKeyword: (id: string) => void
}

export default function KeywordManager({
  trackedKeywords,
  sites,
  newKeywords,
  setNewKeywords,
  addingSiteId,
  setAddingSiteId,
  saving,
  onAddKeywords,
  onDeleteKeyword,
}: KeywordManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Tracked Keywords</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Add keywords (one per line)</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={"web design melbourne\nseo agency sydney\ncustom software brisbane"}
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium block">Site</label>
            <Select value={addingSiteId || sites[0]?.id || ''} onValueChange={setAddingSiteId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onAddKeywords} disabled={saving || !newKeywords.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Adding...' : 'Add Keywords'}
            </Button>
          </div>
        </div>

        {trackedKeywords.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackedKeywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell>{kw.keyword}</TableCell>
                  <TableCell className="text-muted-foreground">{kw.site?.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteKeyword(kw.id)} aria-label={`Delete keyword ${kw.keyword}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
