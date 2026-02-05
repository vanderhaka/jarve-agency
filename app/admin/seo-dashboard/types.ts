export interface TrackedKeyword {
  id: string
  keyword: string
  active: boolean
  site: { id: string; domain: string; name: string }
}

export interface Site {
  id: string
  domain: string
  name: string
}

export interface RankingEntry {
  id: string
  position: number | null
  url: string | null
  date: string
  keyword: { id: string; keyword: string; site_id: string }
}

export interface PseoStats {
  published: number
  draft: number
  total: number
  breakdown: Record<string, { published: number; draft: number; total: number }>
  recentPages: { id: string; slug: string; meta_title: string | null; updated_at: string }[]
  dripRate: number
  estCompletionDate: string
  estDaysRemaining: number
  pagesRanking: number
  publishedTotal: number
}

export interface Summary {
  sites: Site[]
  avgPosition: number | null
  top10: number
  top30: number
  totalTracked: number
  totalRanking: number
  topMovers: { keyword: string; current: number; previous: number; change: number }[]
  biggestDrops: { keyword: string; current: number; previous: number; change: number }[]
}

export interface KeywordRow {
  keyword: string
  current: number | null
  best: number | null
  change: number | null
  url: string | null
}
