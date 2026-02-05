'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartDataPoint {
  date: string
  avgPosition: number
}

interface PositionTrendChartProps {
  siteId?: string
  days?: number
  positionBucket?: string
  trend?: string
}

export default function PositionTrendChart({ siteId = 'all', days = 30, positionBucket = 'all', trend = 'all' }: PositionTrendChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function fetchData() {
      const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : ''
      const res = await fetch(`/api/admin/rankings?days=${days}${siteParam}`, {
        signal: controller.signal,
      })

      if (cancelled) return

      if (res.ok) {
        const { rankings } = await res.json()
        const filtered = filterRankings(rankings, positionBucket, trend)
        const processed = processRankingData(filtered)
        setData(processed)
      }
      setLoading(false)
    }

    fetchData().catch((err) => {
      if (err?.name !== 'AbortError') {
        console.error('Failed to fetch position trend data:', err)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [siteId, days, positionBucket, trend])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Position Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No ranking data yet. Data appears after the first daily cron run.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                reversed
                domain={[1, 'auto']}
                fontSize={12}
                label={{
                  value: 'Position',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value as string)
                  return date.toLocaleDateString()
                }}
                formatter={(value: number) => [value.toFixed(1), 'Avg Position']}
              />
              <Line
                type="monotone"
                dataKey="avgPosition"
                stroke="hsl(220, 70%, 50%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

interface RankingEntry {
  position: number | null
  date: string
}

function filterRankings(rankings: RankingEntry[], positionBucket: string, _trend: string): RankingEntry[] {
  let filtered = rankings

  // Filter by position bucket
  if (positionBucket !== 'all') {
    filtered = filtered.filter((r) => {
      if (r.position === null) return positionBucket === 'not-ranking'
      if (positionBucket === 'top3') return r.position <= 3
      if (positionBucket === '4-10') return r.position >= 4 && r.position <= 10
      if (positionBucket === '11-20') return r.position >= 11 && r.position <= 20
      if (positionBucket === '21-50') return r.position >= 21 && r.position <= 50
      if (positionBucket === '51-100') return r.position >= 51 && r.position <= 100
      return false
    })
  }

  // Note: Trend filtering would require comparing multiple time points
  // This is a simplified version - full implementation would need historical data

  return filtered
}

function processRankingData(rankings: RankingEntry[]): ChartDataPoint[] {
  // Group by date and calculate average position
  const byDate = new Map<string, number[]>()

  for (const r of rankings) {
    if (r.position === null) continue
    if (!byDate.has(r.date)) {
      byDate.set(r.date, [])
    }
    byDate.get(r.date)!.push(r.position)
  }

  // Calculate averages
  const result: ChartDataPoint[] = []
  for (const [date, positions] of byDate) {
    if (positions.length > 0) {
      const avgPosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length
      result.push({ date, avgPosition })
    }
  }

  // Sort by date
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
