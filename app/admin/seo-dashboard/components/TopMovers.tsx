'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react'

interface MoverEntry {
  keyword: string
  current: number | null
  previous: number | null
  delta: number
}

interface TopMoversProps {
  siteId?: string
  positionBucket?: string
}

export default function TopMovers({ siteId = 'all', positionBucket = 'all' }: TopMoversProps) {
  const [improvers, setImprovers] = useState<MoverEntry[]>([])
  const [decliners, setDecliners] = useState<MoverEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function fetchData() {
      const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : ''
      // Get last 14 days to compare current vs previous week
      const res = await fetch(`/api/admin/rankings?days=14${siteParam}`, {
        signal: controller.signal,
      })

      if (cancelled) return

      if (res.ok) {
        const { rankings } = await res.json()
        const { improvers: imp, decliners: dec } = processMovers(rankings, positionBucket)
        setImprovers(imp)
        setDecliners(dec)
      }
      setLoading(false)
    }

    fetchData().catch(() => {})

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [siteId, positionBucket])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-green-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Improvers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : improvers.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No improvements detected yet
            </div>
          ) : (
            <div className="space-y-3">
              {improvers.map((m, idx) => (
                <div key={`${m.keyword}-${idx}`} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      Position {m.previous ?? 'N/A'} → {m.current ?? 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {Math.abs(m.delta)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Biggest Drops
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : decliners.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No drops detected yet
            </div>
          ) : (
            <div className="space-y-3">
              {decliners.map((m, idx) => (
                <div key={`${m.keyword}-${idx}`} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      Position {m.previous ?? 'N/A'} → {m.current ?? 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-red-600 border-red-600">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    {Math.abs(m.delta)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface RankingEntry {
  position: number | null
  date: string
  keyword: { id: string; keyword: string }
}

function processMovers(rankings: RankingEntry[], positionBucket: string): {
  improvers: MoverEntry[]
  decliners: MoverEntry[]
} {
  // Group by keyword and get latest and previous positions
  const byKeyword = new Map<string, RankingEntry[]>()

  for (const r of rankings) {
    const kwText = r.keyword?.keyword
    if (!kwText) continue
    if (!byKeyword.has(kwText)) {
      byKeyword.set(kwText, [])
    }
    byKeyword.get(kwText)!.push(r)
  }

  const movers: MoverEntry[] = []

  for (const [keyword, entries] of byKeyword) {
    // Sort by date descending
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date))

    const latest = sorted[0]
    // Find previous entry (at least 3 days ago to avoid daily noise)
    const previous = sorted.find((e, idx) => {
      if (idx === 0) return false
      const daysDiff = Math.abs(
        (new Date(latest.date).getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff >= 3
    })

    // Calculate delta only if both positions exist
    if (
      latest &&
      previous &&
      latest.position !== null &&
      previous.position !== null
    ) {
      // Apply position bucket filter
      if (positionBucket !== 'all') {
        const pos = latest.position
        let matchesBucket = false
        if (positionBucket === 'top3' && pos <= 3) matchesBucket = true
        if (positionBucket === '4-10' && pos >= 4 && pos <= 10) matchesBucket = true
        if (positionBucket === '11-20' && pos >= 11 && pos <= 20) matchesBucket = true
        if (positionBucket === '21-50' && pos >= 21 && pos <= 50) matchesBucket = true
        if (positionBucket === '51-100' && pos >= 51 && pos <= 100) matchesBucket = true

        if (!matchesBucket) continue
      }

      // Positive delta = improved (moved up = lower position number)
      const delta = previous.position - latest.position

      if (delta !== 0) {
        movers.push({
          keyword,
          current: latest.position,
          previous: previous.position,
          delta,
        })
      }
    }
  }

  // Sort and take top 5 improvers (positive delta)
  const improvers = movers
    .filter((m) => m.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)

  // Sort and take top 5 decliners (negative delta)
  const decliners = movers
    .filter((m) => m.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5)

  return { improvers, decliners }
}
