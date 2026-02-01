'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DistributionBucket {
  name: string
  count: number
  fill: string
}

interface DistributionChartProps {
  siteId?: string
  trend?: string
}

export default function DistributionChart({ siteId = 'all', trend = 'all' }: DistributionChartProps) {
  const [data, setData] = useState<DistributionBucket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function fetchData() {
      const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : ''
      // Get recent data to find latest positions
      const res = await fetch(`/api/admin/rankings?days=7${siteParam}`, {
        signal: controller.signal,
      })

      if (cancelled) return

      if (res.ok) {
        const { rankings } = await res.json()
        const processed = processDistribution(rankings, trend)
        setData(processed)
      }
      setLoading(false)
    }

    fetchData().catch(() => {})

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [siteId, trend])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.every(d => d.count === 0) ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No ranking data yet. Data appears after the first daily cron run.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={12}
                width={100}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Keywords']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

interface RankingEntry {
  position: number | null
  date: string
  keyword: { id: string; keyword: string }
}

function processDistribution(rankings: RankingEntry[], _trend: string): DistributionBucket[] {
  // Get latest position for each keyword
  const latestByKeyword = new Map<string, number | null>()

  for (const r of rankings) {
    const kwId = r.keyword?.id
    if (!kwId) continue

    const existing = latestByKeyword.get(kwId)
    if (!existing || r.date > existing.toString()) {
      latestByKeyword.set(kwId, r.position)
    }
  }

  // Count keywords in each bucket
  const buckets = {
    top3: 0,
    top10: 0,
    top20: 0,
    top50: 0,
    top100: 0,
    notRanking: 0,
  }

  for (const position of latestByKeyword.values()) {
    if (position === null) {
      buckets.notRanking++
    } else if (position <= 3) {
      buckets.top3++
    } else if (position <= 10) {
      buckets.top10++
    } else if (position <= 20) {
      buckets.top20++
    } else if (position <= 50) {
      buckets.top50++
    } else if (position <= 100) {
      buckets.top100++
    } else {
      buckets.notRanking++
    }
  }

  return [
    { name: 'Top 3', count: buckets.top3, fill: 'hsl(142, 76%, 36%)' }, // green
    { name: '4-10', count: buckets.top10, fill: 'hsl(142, 71%, 45%)' }, // lighter green
    { name: '11-20', count: buckets.top20, fill: 'hsl(48, 96%, 53%)' }, // yellow
    { name: '21-50', count: buckets.top50, fill: 'hsl(25, 95%, 53%)' }, // orange
    { name: '51-100', count: buckets.top100, fill: 'hsl(0, 84%, 60%)' }, // red
    { name: 'Not ranking', count: buckets.notRanking, fill: 'hsl(0, 0%, 60%)' }, // gray
  ]
}
