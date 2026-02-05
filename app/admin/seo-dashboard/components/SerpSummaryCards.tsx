'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, TrendingUp, Target, Search, BarChart3 } from 'lucide-react'
import type { Summary } from '../types'

interface SerpSummaryCardsProps {
  summary: Summary | null
}

export default function SerpSummaryCards({ summary }: SerpSummaryCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.avgPosition ?? '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top 10</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.top10 ?? 0}</div>
            <p className="text-xs text-muted-foreground">keywords on page 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top 30</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.top30 ?? 0}</div>
            <p className="text-xs text-muted-foreground">keywords in top 3 pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tracked</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTracked ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalRanking ?? 0} ranking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top movers from summary */}
      {summary && summary.topMovers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Top Movers (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.topMovers.map((m) => (
                  <div key={m.keyword} className="flex justify-between items-center">
                    <span className="text-sm">{m.keyword}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{m.previous} → {m.current}</span>
                      <Badge variant="outline" className="text-green-600">
                        <ArrowUp className="h-3 w-3 mr-1" />+{m.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Biggest Drops (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.biggestDrops.map((m) => (
                  <div key={m.keyword} className="flex justify-between items-center">
                    <span className="text-sm">{m.keyword}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{m.previous} → {m.current}</span>
                      <Badge variant="outline" className="text-red-600">
                        <ArrowDown className="h-3 w-3 mr-1" />{m.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
