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

  let brokenCount = 0

  for (const page of pages) {
    if (!page.content) continue
    const results = await checkPageContent(page.slug, page.content as Record<string, unknown>)
    brokenCount += results.filter((r) => r.is_broken).length
  }

  return brokenCount
}

/**
 * Check all links found in page content JSON.
 */
async function checkPageContent(slug: string, content: Record<string, unknown>): Promise<LinkCheckResult[]> {
  const supabase = createAdminClient()
  const urls = extractUrls(content)
  const results: LinkCheckResult[] = []

  for (const url of urls) {
    const result = await checkUrl(slug, url)
    results.push(result)
  }

  // Store results
  if (results.length > 0) {
    await supabase.from('seo_link_checks').insert(results)
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
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

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
