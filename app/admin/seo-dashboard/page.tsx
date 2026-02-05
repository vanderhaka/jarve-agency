'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import PositionTrendChart from './components/PositionTrendChart'
import DistributionChart from './components/DistributionChart'
import TopMovers from './components/TopMovers'
import RankingFilters from './components/RankingFilters'
import AlertsPanel from './components/AlertsPanel'
import ContentPipeline from './components/ContentPipeline'
import SerpSummaryCards from './components/SerpSummaryCards'
import KeywordChart from './components/KeywordChart'
import KeywordTable from './components/KeywordTable'
import KeywordManager from './components/KeywordManager'
import { useSeoDashboard } from './use-seo-dashboard'

export default function SeoRankingsPage() {
  const {
    summary,
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
  } = useSeoDashboard()

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
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/admin/export/rankings?format=csv&days=${days}`} download>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/admin/export/pages?format=csv&status=all`} download>
              <Download className="h-4 w-4 mr-2" />
              Export Pages
            </a>
          </Button>
        </div>
      </div>

      {/* pSEO Content Pipeline */}
      {pseoStats && <ContentPipeline pseoStats={pseoStats} />}

      {/* Alerts */}
      <AlertsPanel />

      {/* SERP Rankings */}
      <h2 className="text-xl font-semibold">SERP Rankings</h2>

      {/* Ranking filters */}
      <RankingFilters filters={filters} onChange={setFilters} />

      {/* Summary cards + movers from summary API */}
      <SerpSummaryCards summary={summary} />

      {/* Analytics charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PositionTrendChart
          siteId={siteId}
          days={parseInt(days)}
          positionBucket={filters.positionBucket}
          trend={filters.trend}
        />
        <DistributionChart
          siteId={siteId}
          trend={filters.trend}
        />
      </div>

      {/* Top Movers */}
      <TopMovers
        siteId={siteId}
        positionBucket={filters.positionBucket}
      />

      {/* Position over time chart */}
      <KeywordChart chartData={chartData} keywords={keywords} loading={loading} />

      {/* Keywords table */}
      <KeywordTable keywordTable={keywordTable} />

      {/* Keyword management */}
      <KeywordManager
        trackedKeywords={trackedKeywords}
        sites={summary?.sites ?? []}
        newKeywords={newKeywords}
        setNewKeywords={setNewKeywords}
        addingSiteId={addingSiteId}
        setAddingSiteId={setAddingSiteId}
        saving={saving}
        onAddKeywords={handleAddKeywords}
        onDeleteKeyword={handleDeleteKeyword}
      />
    </div>
  )
}
