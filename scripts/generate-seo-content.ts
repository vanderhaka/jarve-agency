import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { cities, services, industries, solutions, comparisons } from '../lib/seo'
import type { RoutePattern } from '../lib/seo'
import { generateContent } from '../lib/seo/generation'

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Version creation helper for CLI (uses direct supabase client)
async function createVersionCLI(
  pageId: string,
  content: Record<string, unknown>,
  metaTitle: string,
  metaDescription: string
) {
  const { data: lastVersion } = await supabase
    .from('seo_page_versions')
    .select('version_number')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = lastVersion ? lastVersion.version_number + 1 : 1

  await supabase
    .from('seo_page_versions')
    .insert({
      page_id: pageId,
      version_number: nextVersion,
      content,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
}

interface PageDefinition {
  slug: string
  routePattern: RoutePattern
  prompt: string
  metaTitle: string
  cityTier?: number
}

function buildServiceCityPrompt(serviceName: string, serviceDesc: string, priceRange: string, timeline: string, keyFeatures: string[], typicalClient: string, cityName: string, cityState: string, localDetails: string): string {
  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia. James works with clients Australia-wide.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style — not corporate or salesy
- Solo operator, not an agency with account managers
- Based in Adelaide, SA — works remotely with clients across Australia
- Australian business (ABN registered, AUD pricing, ACST timezone)

## Page Context

**Service:** ${serviceName}
**City:** ${cityName}, ${cityState}
**Price Range:** ${priceRange}
**Timeline:** ${timeline}
**Key Features:** ${keyFeatures.join(', ')}
**Typical Client:** ${typicalClient}
**Service Description:** ${serviceDesc}

**Local Details:**
${localDetails}

## Voice and Tone

Write like James would — a practical tradesman who now builds software. NOT like a marketing agency.

**DO:**
- Be direct and matter-of-fact
- Use simple language a business owner understands
- Sound like a real person, not a brochure
- Be specific and concrete (numbers, examples)
- Australian English spelling (optimise, colour, etc.)

**DON'T:**
- Use filler phrases like "[City] moves fast" or "in today's competitive landscape"
- Sound corporate or polished
- Use buzzwords (cutting-edge, innovative, leverage, synergy)
- Name-drop suburbs just to seem local — only reference locations if genuinely relevant
- Say "we" — James works alone, use "I"

## Required Sections — Return as JSON

Keep content SHORT and SCANNABLE. These are pSEO pages, not blog posts.

Return valid JSON:
{
  "heroHeadline": "max 8 words, punchy direct benefit. Include '${cityName}' naturally within the benefit — e.g. 'Ship your ${cityName} startup idea fast' or 'Build your ${cityName} MVP in weeks'. NEVER use '[Service] ${cityName}' pattern — that's keyword stuffing.",
  "heroSubheadline": "max 20 words, one clear sentence. Mention timeline or price if natural",
  "cityContext": "max 50 words. ONE specific, genuinely local insight about why this service matters here. Reference a real local detail. NOT generic 'lots of businesses here need software'",
  "problemStatement": "max 60 words. What's the actual pain? Specific to this service. Short punchy sentences. You language.",
  "solution": "max 60 words. How James solves it. Mention timeline naturally. Concrete not abstract.",
  "benefits": [
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." }
  ],
  "localSignals": [
    "Signal 1 — choose from: timezone/availability for ${cityName}, how remote collaboration works for ${cityName} specifically, or a practical detail about working across states. NEVER claim past work or experience with specific cities, industries, or companies — James has not worked with every city/industry.",
    "Signal 2 — choose a DIFFERENT angle from signal 1. Options: ABN/AUD/invoicing, turnaround expectations, communication style, or specific availability for this timezone",
    "Signal 3 — choose a DIFFERENT angle again. Make each signal unique — never repeat the same point across signals"
  ],
  "ctaText": "max 6 words, direct action. No 'Let's' or 'Let us'. MUST be unique — not 'Get Your [Service] Quote' every time. Vary the verb and framing.",
  "faq": [
    { "question": "Pricing question about ${serviceName.toLowerCase()} for ${cityName} business", "answer": "40-50 words, practical and direct" },
    { "question": "Process or timeline question", "answer": "40-50 words" },
    { "question": "Technical question specific to ${serviceName.toLowerCase()}", "answer": "40-50 words" },
    { "question": "Remote work / timezone / logistics question for ${cityName}", "answer": "40-50 words" },
    { "question": "Business-specific or industry question", "answer": "40-50 words" }
  ],
  "metaDescription": "max 155 characters. Include ${cityName} and ${serviceName.toLowerCase()} naturally. State a specific benefit and imply a CTA. Must be compelling for Google click-through. Australian English.",
  "testimonialMatch": "15-word description of ideal testimonial for this page"
}

Generate exactly 5 FAQs. Each must cover a different angle: pricing, process/timeline, technical, local logistics (timezone/remote), and business-specific. No rephrased duplicates.

## Content Uniqueness

This is one of ${cities.length} city variations for ${serviceName}. To avoid duplicate content:
1. problemStatement should reference at least one ${cityName}-specific business context
2. benefits descriptions should vary phrasing — don't use identical sentences across cities
3. At least 2 FAQs should be specific to ${cityName} (timezone, logistics, local industry mix)
If swapping "${cityName}" for another city name changes nothing, add real local specificity.

## CRITICAL: No False Claims

NEVER fabricate experience, past projects, or client history. James has NOT necessarily:
- Built MVPs for specific cities' startups (e.g. "Melbourne health tech startups")
- Worked with specific accelerators (e.g. MAP, Stone & Chalk)
- Dealt with specific regulatory bodies (e.g. "ASIC compliance for fintech")
- Had clients in every industry or city

Only state FACTS: Adelaide-based, works remotely Australia-wide, ABN registered, AUD invoicing, ACST timezone. For localSignals, stick to timezone, remote work logistics, and invoicing — never claim city-specific work experience.

For FAQs, do NOT write questions that imply specific local experience. Keep questions about the service itself, pricing, process, and timeline.

## Quality Check Before Responding

1. **NO FALSE CLAIMS** — Re-read every sentence. Does it claim James has done specific work he may not have done? Remove it.
2. Could this content work for ANY city if you swapped the name? If yes, add real local specificity (timezone, logistics — NOT fabricated experience).
3. Does it sound like marketing copy or like a practical person explaining their service? Must be the latter.
4. Is anything over the word limit? Cut it down.
5. Did you use any filler phrases? Remove them.
6. Did you say "we" anywhere? Change to "I".
7. Is your heroHeadline just "[Service] [City]"? That's keyword stuffing. Rewrite it as a benefit.
8. Is your ctaText identical to what you'd write for any other page? Make it specific to this service/city combination.
9. Are your localSignals just generic "ABN registered, AUD pricing" that could apply to any page? Add something specific to ${cityName} (timezone, logistics — NOT experience claims).`
}

function buildIndustryPrompt(industryName: string, painPoints: string[], cityName?: string, cityState?: string, localDetails?: string): string {
  const locationContext = cityName
    ? `\n**City:** ${cityName}, ${cityState}\n**Local Details:** ${localDetails}`
    : '\n**Location:** Australia-wide'

  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style — not corporate or salesy
- Solo operator, not an agency with account managers
- Based in Adelaide, SA — works remotely with clients across Australia
- Australian business (ABN registered, AUD pricing, ACST timezone)

## Page Context

**Industry:** ${industryName}${locationContext}
**Industry Pain Points:** ${painPoints.join('; ')}

## Voice and Tone

Write like James would — a practical tradesman who now builds software. NOT like a marketing agency.

**DO:**
- Be direct and matter-of-fact
- Use simple language a business owner understands
- Sound like a real person, not a brochure
- Be specific and concrete (numbers, examples)
- Australian English spelling (optimise, colour, etc.)

**DON'T:**
- Use filler phrases like "[City] moves fast" or "in today's competitive landscape"
- Sound corporate or polished
- Use buzzwords (cutting-edge, innovative, leverage, synergy)
- Say "we" — James works alone, use "I"

Return valid JSON:
{
  ${cityName ? `"heroHeadline": "max 8 words about software for ${industryName.toLowerCase()}. Include '${cityName}' naturally within the benefit.",` : `"heroHeadline": "max 8 words about software for ${industryName.toLowerCase()}",`}
  "heroSubheadline": "max 20 words",
  ${cityName ? '"cityContext": "max 50 words. ONE specific, genuinely local insight about this industry here. Reference a real local detail from the provided Local Details. NOT generic filler.",' : ''}
  "problemStatement": "max 60 words about ${industryName.toLowerCase()} pain points. Short punchy sentences. You language.",
  "solution": "max 60 words, how I solve it. Concrete not abstract.",
  "benefits": [
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." }
  ],
  ${cityName ? `"localSignals": [
    "Signal 1 — timezone/availability for ${cityName}, how remote collaboration works for ${cityName} specifically, or a practical detail about working across states. NEVER claim past work or experience with ${cityName} ${industryName.toLowerCase()} businesses.",
    "Signal 2 — different angle from signal 1. Options: ABN/AUD/invoicing, turnaround expectations, communication style, or specific availability for this timezone",
    "Signal 3 — different angle again. Make each signal unique — never repeat the same point"
  ],` : ''}
  "ctaText": "max 6 words, direct action. No 'Let's'. MUST be unique per page.",
  "metaDescription": "max 155 characters. Include ${industryName.toLowerCase()}${cityName ? ` and ${cityName}` : ''} naturally. State a specific benefit and imply a CTA. Compelling for Google click-through. Australian English.",
  "faq": [
    { "question": "Pricing question about ${industryName.toLowerCase()} software", "answer": "40-50 words, practical" },
    { "question": "Process or timeline question", "answer": "40-50 words" },
    { "question": "Technical question specific to ${industryName.toLowerCase()}", "answer": "40-50 words" },
    ${cityName ? `{ "question": "Remote work / timezone / logistics question for ${cityName}", "answer": "40-50 words" },` : ''}
    { "question": "Industry-specific question about ${industryName.toLowerCase()}", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate ${cityName ? '5' : '4-5'} FAQs. Each must be genuinely different — cover pricing, process, timeline, technical, and industry angles.

## CRITICAL: No False Claims

NEVER fabricate experience, past projects, or client history. James has NOT necessarily:
- Built software for specific ${industryName.toLowerCase()} businesses
- Worked with specific industry associations or regulatory bodies
- Had clients in every industry or city

Only state FACTS: Adelaide-based, works remotely Australia-wide, ABN registered, AUD invoicing, ACST timezone.${cityName ? ` For localSignals, stick to timezone, remote work logistics, and invoicing — never claim city-specific work experience.` : ''}

## Quality Check Before Responding

1. **NO FALSE CLAIMS** — Re-read every sentence. Does it claim James has done specific work he may not have done? Remove it.
2. Does it sound like a practical person explaining their service? Must be the latter.
3. Is anything over the word limit? Cut it down.
4. Did you use any filler phrases or buzzwords? Remove them.
5. Did you say "we" anywhere? Change to "I".
6. Is your metaDescription under 155 chars and genuinely click-worthy?`
}

function buildSolutionPrompt(problem: string, description: string): string {
  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style — not corporate or salesy
- Solo operator based in Adelaide, works Australia-wide
- Australian business (ABN registered, AUD pricing, ACST timezone)

## Page Context
**Solution:** ${problem}
**Description:** ${description}

## Voice: Direct, practical, first person ("I"). Australian English. No buzzwords (cutting-edge, innovative, leverage, synergy). No "we" — James works alone.

Return valid JSON:
{
  "heroHeadline": "max 8 words, benefit-driven",
  "heroSubheadline": "max 20 words",
  "problemStatement": "max 60 words. Short punchy sentences. You language.",
  "solution": "max 60 words. Concrete not abstract.",
  "benefits": [
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." }
  ],
  "ctaText": "max 6 words, direct action. No 'Let's'. Unique per page.",
  "metaDescription": "max 155 characters. Include the solution topic naturally. State a specific benefit and imply a CTA. Australian English.",
  "faq": [
    { "question": "Pricing question about this solution", "answer": "40-50 words, practical" },
    { "question": "Process or timeline question", "answer": "40-50 words" },
    { "question": "Technical question", "answer": "40-50 words" },
    { "question": "Business impact question", "answer": "40-50 words" },
    { "question": "Comparison or alternatives question", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate exactly 5 FAQs. Each must cover a different angle.

## CRITICAL: No False Claims

NEVER fabricate experience, past projects, or client history. James has NOT necessarily:
- Implemented this specific solution for past clients
- Worked with specific companies or industries
- Had a specific number of clients or projects

Only state FACTS about capabilities, not claimed history.

## Quality Check
1. **NO FALSE CLAIMS** — Does any sentence claim specific past work? Remove it.
2. Did you say "we"? Change to "I".
3. Any buzzwords? Remove them.
4. Is metaDescription under 155 chars and click-worthy?`
}

function buildComparisonPrompt(tool: string, category: string): string {
  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style — not corporate or salesy
- Solo operator based in Adelaide, works Australia-wide
- Australian business (ABN registered, AUD pricing, ACST timezone)

## Page Context
**Comparison:** Custom-built software vs ${tool} (${category})
Be fair and balanced. Explain when custom is better AND when ${tool} is the right choice.

## Voice: Direct, practical, first person ("I"). Australian English. No buzzwords (cutting-edge, innovative, leverage, synergy). No "we" — James works alone.

Return valid JSON:
{
  "heroHeadline": "max 8 words, benefit-driven",
  "heroSubheadline": "max 20 words",
  "problemStatement": "max 60 words about outgrowing ${tool}. Short punchy sentences.",
  "solution": "max 60 words about when custom makes sense. Concrete not abstract.",
  "benefits": [
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." },
    { "title": "3-4 words", "description": "One sentence, specific outcome. Max 25 words." }
  ],
  "ctaText": "max 6 words, direct action. No 'Let's'. Unique per page.",
  "metaDescription": "max 155 characters. Include '${tool}' and 'custom software' naturally. State when custom wins. Australian English.",
  "faq": [
    { "question": "Genuine question about custom vs ${tool}", "answer": "40-50 words, fair and practical" },
    { "question": "Migration cost or timeline question", "answer": "40-50 words" },
    { "question": "When to stick with ${tool}", "answer": "40-50 words" },
    { "question": "Technical comparison question", "answer": "40-50 words" },
    { "question": "Business impact or ROI question", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate exactly 5 FAQs. Each must cover a different angle.

## CRITICAL: No False Claims

NEVER fabricate experience, past projects, or client history. James has NOT necessarily:
- Migrated clients from ${tool} to custom software
- Worked with specific companies using ${tool}
- Had a specific number of migration projects

Be fair to ${tool} — it's a good product. Only recommend custom when genuinely better. Only state FACTS about capabilities, not claimed history.

## Quality Check
1. **NO FALSE CLAIMS** — Does any sentence claim specific past work or migrations? Remove it.
2. Is the comparison genuinely fair? Don't trash ${tool}.
3. Did you say "we"? Change to "I".
4. Any buzzwords? Remove them.
5. Is metaDescription under 155 chars and click-worthy?`
}

function buildPageDefinitions(): PageDefinition[] {
  const pages: PageDefinition[] = []

  // services-city: 6 services x 15 cities = 90
  for (const service of services) {
    for (const city of cities) {
      const slug = `${service.slug}-${city.slug}`
      pages.push({
        slug,
        routePattern: 'services-city',
        prompt: buildServiceCityPrompt(
          service.name, service.description, service.priceRange, service.timeline,
          service.keyFeatures, service.typicalClient,
          city.name, city.state, city.localDetails
        ),
        metaTitle: `${service.name} in ${city.name} | Jarve`,
        cityTier: city.tier,
      })
    }
  }

  // industries: 12
  for (const industry of industries) {
    pages.push({
      slug: `industry-${industry.slug}`,
      routePattern: 'industries',
      prompt: buildIndustryPrompt(industry.name, industry.painPoints),
      metaTitle: `${industry.name} Software Development | Jarve`,
    })
  }

  // industries-city: 12 industries x 15 cities = 180
  for (const industry of industries) {
    for (const city of cities) {
      const slug = `industry-${industry.slug}-${city.slug}`
      pages.push({
        slug,
        routePattern: 'industries-city',
        prompt: buildIndustryPrompt(industry.name, industry.painPoints, city.name, city.state, city.localDetails),
        metaTitle: `${industry.name} Software in ${city.name} | Jarve`,
        cityTier: city.tier,
      })
    }
  }

  // solutions: 15
  for (const solution of solutions) {
    pages.push({
      slug: `solution-${solution.slug}`,
      routePattern: 'solutions',
      prompt: buildSolutionPrompt(solution.problem, solution.description),
      metaTitle: `${solution.problem} | Jarve`,
    })
  }

  // comparisons: 10
  for (const comp of comparisons) {
    pages.push({
      slug: `compare-${comp.slug}`,
      routePattern: 'comparisons',
      prompt: buildComparisonPrompt(comp.tool, comp.category),
      metaTitle: `Custom Software vs ${comp.tool} | Jarve`,
    })
  }

  return pages
}

async function generatePageContent(page: PageDefinition): Promise<Record<string, unknown>> {
  return generateContent(page.prompt)
}

async function upsertPage(page: PageDefinition, content: Record<string, unknown>) {
  // Use LLM-generated meta description, fall back to template
  const metaDesc = typeof content.metaDescription === 'string' && content.metaDescription.length > 0
    ? content.metaDescription.slice(0, 160)
    : `${page.metaTitle.replace(' | Jarve', '')}. Australian developer, Adelaide-based, working Australia-wide.`

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(
      {
        route_pattern: page.routePattern,
        slug: page.slug,
        status: 'draft',
        content,
        meta_title: page.metaTitle,
        meta_description: metaDesc,
        city_tier: page.cityTier ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    .select()
    .single()

  if (error) throw new Error(`Upsert failed for ${page.slug}: ${error.message}`)

  // Create version for the upserted page
  if (data) {
    await createVersionCLI(data.id, content, page.metaTitle, metaDesc)
  }
}

async function countPages() {
  const pages = buildPageDefinitions()
  const byPattern: Record<string, number> = {}
  for (const p of pages) {
    byPattern[p.routePattern] = (byPattern[p.routePattern] || 0) + 1
  }
  console.log('Page counts by pattern:')
  for (const [pattern, count] of Object.entries(byPattern)) {
    console.log(`  ${pattern}: ${count}`)
  }
  console.log(`  TOTAL: ${pages.length}`)
}

async function generate(pattern?: string, limit?: number) {
  let pages = buildPageDefinitions()
  if (pattern) {
    pages = pages.filter((p) => p.routePattern === pattern)
  }
  if (limit) {
    pages = pages.slice(0, limit)
  }

  console.log(`Generating ${pages.length} pages...`)

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    console.log(`[${i + 1}/${pages.length}] ${page.slug}`)
    try {
      const content = await generatePageContent(page)
      await upsertPage(page, content)
      console.log(`  -> saved as draft`)
    } catch (err) {
      console.error(`  -> ERROR: ${err instanceof Error ? err.message : err}`)
    }
    // Rate limit: 1 second between calls
    if (i < pages.length - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

function slugToPath(slug: string, routePattern: string): string {
  switch (routePattern) {
    case 'services-city': {
      for (const svc of services) {
        for (const c of cities) {
          if (`${svc.slug}-${c.slug}` === slug) return `/services/${svc.slug}/${c.slug}`
        }
      }
      return `/services/${slug}`
    }
    case 'industries':
      return `/industries/${slug.replace('industry-', '')}`
    case 'industries-city': {
      for (const ind of industries) {
        for (const c of cities) {
          if (`industry-${ind.slug}-${c.slug}` === slug) return `/industries/${ind.slug}/${c.slug}`
        }
      }
      return `/industries/${slug.replace('industry-', '')}`
    }
    case 'solutions':
      return `/solutions/${slug.replace('solution-', '')}`
    case 'comparisons':
      return `/compare/${slug.replace('compare-', '')}`
    default:
      return `/${slug}`
  }
}

async function publish(slugPattern: string) {
  const { data, error } = await supabase
    .from('seo_pages')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .like('slug', slugPattern)
    .select('slug, route_pattern')

  if (error) {
    console.error(`Publish failed: ${error.message}`)
    return
  }
  console.log(`Published ${data?.length ?? 0} pages matching "${slugPattern}"`)
  if (data && data.length > 0) {
    console.log('\nLinks:')
    for (const page of data) {
      const path = slugToPath(page.slug, page.route_pattern)
      console.log(`  http://localhost:3000${path}`)
    }
  }
}

// CLI
const [command, ...args] = process.argv.slice(2)

switch (command) {
  case 'count':
    countPages()
    break
  case 'generate':
    generate(args[0], args[1] ? parseInt(args[1]) : undefined)
    break
  case 'publish':
    if (!args[0]) {
      console.error('Usage: publish <slug-pattern>')
      process.exit(1)
    }
    publish(args[0])
    break
  default:
    console.log('Usage:')
    console.log('  generate-seo count')
    console.log('  generate-seo generate [pattern] [limit]')
    console.log('  generate-seo publish <slug-pattern>')
    console.log('')
    console.log('Patterns: services-city, industries, industries-city, solutions, comparisons')
}
