import { createAdminClient } from '@/utils/supabase/admin'

interface LinkCheckResult {
  source_slug: string
  target_url: string
  status_code: number | null
  is_broken: boolean
}

/**
 * Check all internal links on a published page by fetching its content
 * and testing each URL found.
 */
export async function checkPageLinks(slug: string): Promise<LinkCheckResult[]> {
  const supabase = createAdminClient()

  const { data: page } = await supabase
    .from('seo_pages')
    .select('content')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!page?.content) return []

  return checkPageContent(slug, page.content as Record<string, unknown>)
}

/**
 * Run link health check across all published pages.
 * Returns total broken link count.
 */
export async function runLinkHealthCheck(): Promise<number> {
  const supabase = createAdminClient()

  // Fetch slug + content in a single query to avoid N+1
  const { data: pages } = await supabase
    .from('seo_pages')
    .select('slug, content')
    .eq('status', 'published')

  if (!pages || pages.length === 0) return 0

  // Process pages with concurrency limit of 20
  const CONCURRENCY = 20
  let brokenCount = 0
  const pagesWithContent = pages.filter((p) => p.content)

  for (let i = 0; i < pagesWithContent.length; i += CONCURRENCY) {
    const batch = pagesWithContent.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map((page) =>
        checkPageContent(page.slug, page.content as Record<string, unknown>)
      )
    )
    for (const pageResults of results) {
      brokenCount += pageResults.filter((r) => r.is_broken).length
    }
  }

  return brokenCount
}

/**
 * Check all links found in page content JSON.
 */
async function checkPageContent(slug: string, content: Record<string, unknown>): Promise<LinkCheckResult[]> {
  const supabase = createAdminClient()
  const urls = extractUrls(content)

  // Skip URLs checked in the last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: recentChecks } = await supabase
    .from('seo_link_checks')
    .select('target_url')
    .eq('source_slug', slug)
    .gte('checked_at', weekAgo.toISOString())

  const recentlyChecked = new Set((recentChecks ?? []).map((r) => r.target_url))
  const urlsToCheck = urls.filter((url) => !recentlyChecked.has(url))

  const results: LinkCheckResult[] = []

  for (const url of urlsToCheck) {
    const result = await checkUrl(slug, url)
    results.push(result)
  }

  // Store results (upsert to handle re-checks, update checked_at timestamp)
  if (results.length > 0) {
    const now = new Date().toISOString()
    await supabase
      .from('seo_link_checks')
      .upsert(
        results.map((r) => ({ ...r, checked_at: now })),
        { onConflict: 'source_slug,target_url' }
      )
  }

  return results
}

function extractUrls(obj: unknown): string[] {
  const urls: string[] = []
  const urlRegex = /https?:\/\/[^\s"'<>]+/g

  function walk(value: unknown) {
    if (typeof value === 'string') {
      const matches = value.match(urlRegex)
      if (matches) urls.push(...matches)
    } else if (Array.isArray(value)) {
      value.forEach(walk)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk)
    }
  }

  walk(obj)
  return [...new Set(urls)]
}

async function checkUrl(sourceSlug: string, url: string): Promise<LinkCheckResult> {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    // Fall back to GET if server doesn't support HEAD
    if (response.status === 405) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })
    }

    return {
      source_slug: sourceSlug,
      target_url: url,
      status_code: response.status,
      is_broken: response.status >= 400,
    }
  } catch {
    return {
      source_slug: sourceSlug,
      target_url: url,
      status_code: null,
      is_broken: true,
    }
  }
}
