import { createAdminClient } from '@/utils/supabase/admin'

const SERPAPI_BASE = 'https://serpapi.com/search.json'

interface SerpResult {
  position: number
  link: string
  title: string
  snippet: string
}

interface SerpApiResponse {
  organic_results?: SerpResult[]
  error?: string
}

export async function checkKeywordRanking(
  keyword: string,
  domain: string
): Promise<{ position: number | null; url: string | null; snippet: SerpResult | null }> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) throw new Error('SERPAPI_KEY not set')

  const params = new URLSearchParams({
    q: keyword,
    engine: 'google',
    gl: 'au',
    hl: 'en',
    num: '100',
    api_key: apiKey,
  })

  const res = await fetch(`${SERPAPI_BASE}?${params}`)
  if (!res.ok) {
    throw new Error(`SerpAPI error: ${res.status} ${res.statusText}`)
  }

  const data: SerpApiResponse = await res.json()

  if (data.error) {
    throw new Error(`SerpAPI: ${data.error}`)
  }

  const match = data.organic_results?.find((r) =>
    r.link.includes(domain)
  )

  if (!match) {
    return { position: null, url: null, snippet: null }
  }

  return {
    position: match.position,
    url: match.link,
    snippet: match,
  }
}

export async function runDailyRankCheck(): Promise<{
  checked: number
  found: number
  errors: string[]
}> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let checked = 0
  let found = 0

  const { data: keywords, error: kwError } = await supabase
    .from('tracked_keywords')
    .select('id, keyword, site:tracked_sites!inner(domain)')
    .eq('active', true)
    .eq('tracked_sites.active', true)

  if (kwError) {
    throw new Error(`Failed to fetch keywords: ${kwError.message}`)
  }

  if (!keywords || keywords.length === 0) {
    return { checked: 0, found: 0, errors: [] }
  }

  const today = new Date().toISOString().split('T')[0]

  for (let idx = 0; idx < keywords.length; idx++) {
    const kw = keywords[idx]
    try {
      // Rate limit SerpAPI calls: 1.5s delay between requests
      if (idx > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      const site = kw.site as unknown as { domain: string }
      const result = await checkKeywordRanking(kw.keyword, site.domain)

      await supabase.from('ranking_history').upsert(
        {
          keyword_id: kw.id,
          position: result.position,
          url: result.url,
          date: today,
          serp_data: result.snippet,
        },
        { onConflict: 'keyword_id,date' }
      )

      checked++
      if (result.position !== null) found++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${kw.keyword}: ${msg}`)
    }
  }

  return { checked, found, errors }
}
