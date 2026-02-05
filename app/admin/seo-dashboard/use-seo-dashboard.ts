import { useEffect, useMemo, useState } from 'react'
import type { RankingFiltersState } from './components/RankingFilters'
import type { TrackedKeyword, RankingEntry, PseoStats, Summary, KeywordRow } from './types'

export function useSeoDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [siteId, setSiteId] = useState<string>('all')
  const [days, setDays] = useState<string>('30')
  const [loading, setLoading] = useState(true)
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([])
  const [newKeywords, setNewKeywords] = useState('')
  const [addingSiteId, setAddingSiteId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const [pseoStats, setPseoStats] = useState<PseoStats | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [filters, setFilters] = useState<RankingFiltersState>({
    positionBucket: 'all',
    cityTier: 'all',
    trend: 'all',
  })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const siteParam = siteId !== 'all' ? `&site_id=${siteId}` : ''
    const signal = controller.signal

    async function fetchData() {
      const [sumRes, rankRes, kwRes, pseoRes] = await Promise.all([
        fetch(`/api/admin/rankings/summary?${siteParam}`, { signal }),
        fetch(`/api/admin/rankings?days=${days}${siteParam}`, { signal }),
        fetch('/api/admin/rankings/keywords', { signal }),
        fetch('/api/admin/seo-pages/stats', { signal }),
      ])

      if (cancelled) return

      const results: Partial<{
        summary: Summary
        rankings: RankingEntry[]
        keywords: TrackedKeyword[]
        pseo: PseoStats
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
      if (pseoRes.ok) results.pseo = await pseoRes.json()

      return results
    }

    fetchData().then((results) => {
      if (cancelled || !results) return
      if (results.summary) setSummary(results.summary)
      if (results.rankings) setRankings(results.rankings)
      if (results.keywords) setTrackedKeywords(results.keywords)
      if (results.pseo) setPseoStats(results.pseo)
      setLoading(false)
    }).catch((err) => {
      if (err?.name !== 'AbortError') {
        console.error('Failed to fetch SEO dashboard data:', err)
      }
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [siteId, days, refreshKey])

  async function handleAddKeywords() {
    const targetSiteId = addingSiteId || summary?.sites[0]?.id
    if (!targetSiteId || !newKeywords.trim()) return

    setSaving(true)
    try {
      const keywords = newKeywords.split('\n').map((k) => k.trim()).filter(Boolean)
      const res = await fetch('/api/admin/rankings/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: targetSiteId, keywords }),
      })
      if (!res.ok) throw new Error(`Failed to add keywords: ${res.status}`)
      setNewKeywords('')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to add keywords:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteKeyword(id: string) {
    try {
      const res = await fetch('/api/admin/rankings/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error(`Failed to delete keyword: ${res.status}`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to delete keyword:', err)
    }
  }

  const chartData = useMemo(() => buildChartData(rankings), [rankings])
  const keywords = useMemo(() => getUniqueKeywords(rankings), [rankings])
  const keywordTable = useMemo(() => buildKeywordTable(rankings), [rankings])

  return {
    summary,
    rankings,
    siteId,
    setSiteId,
    days,
    setDays,
    loading,
    trackedKeywords,
    newKeywords,
    setNewKeywords,
    addingSiteId,
    setAddingSiteId,
    saving,
    pseoStats,
    filters,
    setFilters,
    handleAddKeywords,
    handleDeleteKeyword,
    chartData,
    keywords,
    keywordTable,
  }
}

// --- Pure helper functions ---

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
