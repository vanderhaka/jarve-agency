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
  Legend,
} from 'recharts'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Minus, TrendingUp, Target, Search, BarChart3, Plus, Trash2 } from 'lucide-react'

interface TrackedKeyword {
  id: string
  keyword: string
  active: boolean
  site: { id: string; domain: string; name: string }
}

interface Site {
  id: string
  domain: string
  name: string
}

interface RankingEntry {
  id: string
  position: number | null
  url: string | null
  date: string
  keyword: { id: string; keyword: string; site_id: string }
}

interface Summary {
  sites: Site[]
  avgPosition: number | null
  top10: number
  top30: number
  totalTracked: number
  totalRanking: number
  topMovers: { keyword: string; current: number; previous: number; change: number }[]
  biggestDrops: { keyword: string; current: number; previous: number; change: number }[]
}

const COLORS = [
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 55%)',
  'hsl(190, 70%, 45%)',
  'hsl(50, 80%, 50%)',
  'hsl(320, 60%, 50%)',
]

export default function SeoRankingsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [siteId, setSiteId] = useState<string>('all')
  const [days, setDays] = useState<string>('30')
  const [loading, setLoading] = useState(true)
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([])
  const [newKeywords, setNewKeywords] = useState('')
  const [addingSiteId, setAddingSiteId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : ''
    const signal = controller.signal

    async function fetchData() {
      const [sumRes, rankRes, kwRes] = await Promise.all([
        fetch(`/api/admin/rankings/summary?${siteParam}`, { signal }),
        fetch(`/api/admin/rankings?days=${days}${siteParam}`, { signal }),
        fetch('/api/admin/rankings/keywords', { signal }),
      ])

      if (cancelled) return

      const results: Partial<{
        summary: Summary
        rankings: RankingEntry[]
        keywords: TrackedKeyword[]
      }> = {}

      if (sumRes.ok) results.summary = await sumRes.json()
      if (rankRes.ok) {
        const data = await rankRes.json()
        results.rankings = data.rankings ?? []
      }
      if (kwRes.ok) {
        const data = await kwRes.json()
        results.keywords = data.keywords ?? []
      }

      return results
    }

    fetchData().then((results) => {
      if (cancelled || !results) return
      if (results.summary) setSummary(results.summary)
      if (results.rankings) setRankings(results.rankings)
      if (results.keywords) setTrackedKeywords(results.keywords)
      setLoading(false)
    }).catch(() => {})

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [siteId, days, refreshKey])

  async function handleAddKeywords() {
    const targetSiteId = addingSiteId || summary?.sites[0]?.id
    if (!targetSiteId || !newKeywords.trim()) return

    setSaving(true)
    const keywords = newKeywords.split('\n').map((k) => k.trim()).filter(Boolean)
    await fetch('/api/admin/rankings/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: targetSiteId, keywords }),
    })
    setNewKeywords('')
    setSaving(false)
    setRefreshKey((k) => k + 1)
  }

  async function handleDeleteKeyword(id: string) {
    await fetch('/api/admin/rankings/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setRefreshKey((k) => k + 1)
  }

  // Transform rankings into chart data: { date, keyword1: pos, keyword2: pos, ... }
  const chartData = buildChartData(rankings)
  const keywords = getUniqueKeywords(rankings)

  // Build keyword table: latest position + change
  const keywordTable = buildKeywordTable(rankings)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Rankings</h1>
          <p className="text-muted-foreground">Daily SERP position tracking via SerpAPI</p>
        </div>
        <div className="flex gap-3">
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {summary?.sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
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

      {/* Position over time chart */}
      <Card>
        <CardHeader>
          <CardTitle>Position Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No ranking data yet. Data appears after the first daily cron run.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis reversed domain={[1, 'auto']} fontSize={12} label={{ value: 'Position', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {keywords.map((kw, i) => (
                  <Line
                    key={kw}
                    type="monotone"
                    dataKey={kw}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top movers */}
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

      {/* Keywords table */}
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

      {/* Keyword management */}
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
              <Select value={addingSiteId || summary?.sites[0]?.id || ''} onValueChange={setAddingSiteId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {summary?.sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddKeywords} disabled={saving || !newKeywords.trim()} className="w-full">
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
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteKeyword(kw.id)}>
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
    </div>
  )
}

function buildChartData(rankings: RankingEntry[]) {
  const byDate = new Map<string, Record<string, string | number | null>>()

  for (const r of rankings) {
    const kw = r.keyword?.keyword
    if (!kw) continue
    if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date })
    const row = byDate.get(r.date)!
    row[kw] = r.position
  }

  return Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  )
}

function getUniqueKeywords(rankings: RankingEntry[]): string[] {
  const set = new Set<string>()
  for (const r of rankings) {
    if (r.keyword?.keyword) set.add(r.keyword.keyword)
  }
  return Array.from(set).sort()
}

interface KeywordRow {
  keyword: string
  current: number | null
  best: number | null
  change: number | null
  url: string | null
}

function buildKeywordTable(rankings: RankingEntry[]): KeywordRow[] {
  const byKeyword = new Map<string, RankingEntry[]>()

  for (const r of rankings) {
    const kw = r.keyword?.keyword
    if (!kw) continue
    if (!byKeyword.has(kw)) byKeyword.set(kw, [])
    byKeyword.get(kw)!.push(r)
  }

  const rows: KeywordRow[] = []
  for (const [keyword, entries] of byKeyword) {
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date))
    const latest = sorted[0]
    const positions = sorted.filter((e) => e.position !== null).map((e) => e.position as number)
    const best = positions.length > 0 ? Math.min(...positions) : null

    // 7d change: compare latest vs entry ~7 days ago
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const prevEntry = sorted.find((e) => e.date <= weekAgoStr)

    let change: number | null = null
    if (latest?.position !== null && prevEntry?.position !== null && prevEntry) {
      change = (prevEntry.position as number) - (latest.position as number)
    }

    rows.push({
      keyword,
      current: latest?.position ?? null,
      best,
      change,
      url: latest?.url ?? null,
    })
  }

  return rows.sort((a, b) => (a.current ?? 999) - (b.current ?? 999))
}
