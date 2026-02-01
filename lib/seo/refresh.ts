import { createAdminClient } from '@/utils/supabase/admin'
import { generateContent } from './generation'
import { runQualityGate } from './quality-gate'
import { createVersion } from './versioning'
import type { SeoContent } from './types'

/**
 * Regenerate content for a page: generate new content via AI,
 * run quality gate, create version, and update the page.
 */
export async function refreshPageContent(pageId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createAdminClient()

  const { data: page } = await supabase
    .from('seo_pages')
    .select('id, slug, route_pattern, content, meta_title, meta_description')
    .eq('id', pageId)
    .single()

  if (!page) return { success: false, error: 'Page not found' }

  const existingContent = page.content as Record<string, unknown>

  // Build regeneration prompt from existing content context
  const prompt = buildRefreshPrompt(page.slug, page.route_pattern, existingContent)

  try {
    const newContent = await generateContent(prompt)

    // Parse into SeoContent for quality gate (same pattern as seo-drip route)
    const parsed: SeoContent = {
      heroHeadline: (newContent.heroHeadline as string) ?? '',
      heroSubheadline: (newContent.heroSubheadline as string) ?? '',
      cityContext: newContent.cityContext as string | undefined,
      problemStatement: (newContent.problemStatement as string) ?? '',
      solution: (newContent.solution as string) ?? '',
      benefits: (newContent.benefits as SeoContent['benefits']) ?? [],
      localSignals: newContent.localSignals as string[] | undefined,
      ctaText: (newContent.ctaText as string) ?? 'Get in Touch',
      faq: Array.isArray(newContent.faq)
        ? (newContent.faq as SeoContent['faq'])
        : [],
      layout: newContent.layout as SeoContent['layout'],
      testimonialMatch: newContent.testimonialMatch as string | undefined,
      metaDescription: newContent.metaDescription as string | undefined,
    }

    const qg = runQualityGate(parsed)
    if (!qg.passed) {
      return { success: false, error: `Quality gate failed: ${qg.errors.join(', ')}` }
    }

    // Create version before updating
    await createVersion(
      page.id,
      newContent,
      page.meta_title,
      page.meta_description
    )

    // Update page content
    await supabase
      .from('seo_pages')
      .update({
        content: newContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Content generation failed',
    }
  }
}

function buildRefreshPrompt(
  slug: string,
  routePattern: string,
  existing: Record<string, unknown>
): string {
  return `Regenerate SEO landing page content for the page "${slug}" (pattern: ${routePattern}).

Previous headline was: "${existing.heroHeadline || ''}"
Previous problem statement was: "${existing.problemStatement || ''}"

Generate fresh, unique content in JSON format with these fields:
- heroHeadline (max 10 words)
- heroSubheadline (max 25 words)
- problemStatement (max 80 words)
- solution (max 80 words)
- benefits (array of {title, description}, at least 3)
- ctaText (specific, not generic)
- faq (array of {question, answer}, at least 3)
- metaDescription (max 160 chars)

Rules:
- First person singular (I/my), never we/our
- No buzzwords (cutting-edge, innovative, leverage, synergy)
- No false claims about experience or clients
- Australian English
- Practical, direct tone`
}
