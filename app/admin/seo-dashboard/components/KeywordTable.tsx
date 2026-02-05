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
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { KeywordRow } from '../types'

interface KeywordTableProps {
  keywordTable: KeywordRow[]
}

export default function KeywordTable({ keywordTable }: KeywordTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Best</TableHead>
              <TableHead className="text-right">7d Change</TableHead>
              <TableHead>URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywordTable.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No data yet
                </TableCell>
              </TableRow>
            ) : (
              keywordTable.map((row) => (
                <TableRow key={row.keyword}>
                  <TableCell className="font-medium">{row.keyword}</TableCell>
                  <TableCell className="text-right">
                    {row.current ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">{row.best ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {row.change !== null ? (
                      <span className={row.change > 0 ? 'text-green-600' : row.change < 0 ? 'text-red-600' : ''}>
                        {row.change > 0 ? <ArrowUp className="inline h-3 w-3" /> : row.change < 0 ? <ArrowDown className="inline h-3 w-3" /> : <Minus className="inline h-3 w-3" />}
                        {Math.abs(row.change)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {row.url ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
