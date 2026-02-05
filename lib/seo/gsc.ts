/**
 * Google Search Console Integration
 * Fetches and syncs performance data from GSC API
 */

import { google } from 'googleapis'
import { createAdminClient } from '@/utils/supabase/admin'

interface GSCRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCResponse {
  rows?: GSCRow[]
}

interface GSCDataPoint {
  page_url: string
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  top_queries: { query: string; clicks: number; impressions: number }[]
}

/**
 * Initialize GSC client with service account credentials
 */
function getGSCClient() {
  const clientEmail = process.env.GOOGLE_GSC_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_GSC_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    console.warn('[GSC] Missing credentials: GOOGLE_GSC_CLIENT_EMAIL or GOOGLE_GSC_PRIVATE_KEY')
    return null
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  return google.webmasters({ version: 'v3', auth })
}

/**
 * Fetch GSC data for a specific date range
 */
async function fetchGSCData(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GSCDataPoint[]> {
  const client = getGSCClient()
  if (!client) {
    console.warn('[GSC] Client not initialized, skipping fetch')
    return []
  }

  try {
    // Fetch page-level data
    const pageResponse = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page', 'date'],
        rowLimit: 25000,
      },
    }) as { data: GSCResponse }

    // Fetch query data for top queries per page
    const queryResponse = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 25000,
      },
    }) as { data: GSCResponse }

    const pageData = pageResponse.data.rows || []
    const queryData = queryResponse.data.rows || []

    // Group queries by page
    const queriesByPage = new Map<string, { query: string; clicks: number; impressions: number }[]>()

    queryData.forEach((row) => {
      const [pageUrl, query] = row.keys
      if (!queriesByPage.has(pageUrl)) {
        queriesByPage.set(pageUrl, [])
      }
      queriesByPage.get(pageUrl)!.push({
        query,
        clicks: row.clicks,
        impressions: row.impressions,
      })
    })

    // Sort queries by clicks and take top 10 per page
    queriesByPage.forEach((queries, page) => {
      queries.sort((a, b) => b.clicks - a.clicks)
      queriesByPage.set(page, queries.slice(0, 10))
    })

    // Transform page data
    const dataPoints: GSCDataPoint[] = pageData.map((row) => {
      const [pageUrl, date] = row.keys
      return {
        page_url: pageUrl,
        date,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        top_queries: queriesByPage.get(pageUrl) || [],
      }
    })

    return dataPoints
  } catch (error) {
    console.error('[GSC] Error fetching data:', error)
    return []
  }
}

/**
 * Sync GSC data for the last 7 days
 * Upserts into seo_gsc_data table
 */
export async function syncGSCData(): Promise<{
  synced: number
  skipped: number
  errors: string[]
}> {
  const siteUrl = process.env.GOOGLE_GSC_SITE_URL

  if (!siteUrl) {
    console.warn('[GSC] GOOGLE_GSC_SITE_URL not set, skipping sync')
    return { synced: 0, skipped: 0, errors: ['GOOGLE_GSC_SITE_URL not configured'] }
  }

  const client = getGSCClient()
  if (!client) {
    return { synced: 0, skipped: 0, errors: ['GSC credentials not configured'] }
  }

  // Fetch last 7 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  const dataPoints = await fetchGSCData(
    siteUrl,
    formatDate(startDate),
    formatDate(endDate)
  )

  if (dataPoints.length === 0) {
    return { synced: 0, skipped: 0, errors: [] }
  }

  // Upsert into database
  const supabase = createAdminClient()
  const errors: string[] = []
  let synced = 0

  for (const point of dataPoints) {
    const { error } = await supabase.from('seo_gsc_data').upsert(
      {
        page_url: point.page_url,
        date: point.date,
        clicks: point.clicks,
        impressions: point.impressions,
        ctr: point.ctr,
        position: point.position,
        top_queries: point.top_queries,
      },
      {
        onConflict: 'page_url,date',
      }
    )

    if (error) {
      errors.push(`${point.page_url} (${point.date}): ${error.message}`)
    } else {
      synced++
    }
  }

  return {
    synced,
    skipped: 0,
    errors,
  }
}
