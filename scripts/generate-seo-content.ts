import { config } from 'dotenv'
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { cities, services, industries, solutions, comparisons, tier1Cities } from '../lib/seo'
import type { RoutePattern } from '../lib/seo'

const anthropic = new Anthropic()
const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageDefinition {
  slug: string
  routePattern: RoutePattern
  prompt: string
  metaTitle: string
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
  "heroHeadline": "max 8 words, punchy direct benefit. NEVER just '[Service] [City]' — that's keyword stuffing, not a headline. Lead with the outcome or transformation. City name only if it fits naturally.",
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
    "Signal 1 — choose from: timezone/availability, past work in this city's industries, how remote collaboration works for ${cityName} specifically, or a practical detail about working across states",
    "Signal 2 — choose a DIFFERENT angle from signal 1. Options: ABN/AUD/invoicing, turnaround expectations, communication style, or specific availability for this timezone",
    "Signal 3 — choose a DIFFERENT angle again. Make each signal unique — never repeat the same point across signals"
  ],
  "ctaText": "max 6 words, direct action. No 'Let's' or 'Let us'. MUST be unique — not 'Get Your [Service] Quote' every time. Vary the verb and framing.",
  "faq": [
    { "question": "A genuinely useful question someone in ${cityName} might ask about ${serviceName.toLowerCase()}", "answer": "40-50 words, practical and direct" },
    { "question": "Different angle — pricing, process, or timeline question", "answer": "40-50 words" },
    { "question": "Different angle — technical or industry-specific question", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial for this page"
}

Generate 3-5 FAQs. Each must be a genuinely different question — not rephrased versions of the same thing. Cover pricing, process, timeline, technical, and local angles.

## Quality Check Before Responding

1. Could this content work for ANY city if you swapped the name? If yes, add real local specificity.
2. Does it sound like marketing copy or like a practical person explaining their service? Must be the latter.
3. Is anything over the word limit? Cut it down.
4. Did you use any filler phrases? Remove them.
5. Did you say "we" anywhere? Change to "I".
6. Is your heroHeadline just "[Service] [City]"? That's keyword stuffing. Rewrite it as a benefit.
7. Is your ctaText identical to what you'd write for any other page? Make it specific to this service/city combination.
8. Are your localSignals just generic "ABN registered, AUD pricing" that could apply to any page? Add something specific to ${cityName}.`
}

function buildIndustryPrompt(industryName: string, painPoints: string[], cityName?: string, cityState?: string, localDetails?: string): string {
  const locationContext = cityName
    ? `\n**City:** ${cityName}, ${cityState}\n**Local Details:** ${localDetails}`
    : '\n**Location:** Australia-wide'

  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background on James/JARVE
- Ran a painting business for 20 years before teaching himself to code
- Builds custom web apps, MVPs, and internal tools
- Direct, practical communication style
- Solo operator based in Adelaide, works Australia-wide
- Australian business (ABN registered, AUD pricing)

## Page Context

**Industry:** ${industryName}${locationContext}
**Industry Pain Points:** ${painPoints.join('; ')}

## Voice: Direct, practical, first person ("I"). Australian English. No buzzwords.

Return valid JSON:
{
  "heroHeadline": "max 8 words about software for ${industryName.toLowerCase()}",
  "heroSubheadline": "max 20 words",
  ${cityName ? '"cityContext": "max 50 words, specific local insight about this industry here",' : ''}
  "problemStatement": "max 60 words about ${industryName.toLowerCase()} pain points",
  "solution": "max 60 words, how I solve it",
  "benefits": [
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" }
  ],
  ${cityName ? '"localSignals": ["Adelaide-based, serving ' + cityName + '", "ABN/AUD signal", "Communication signal"],' : ''}
  "ctaText": "max 6 words",
  "faq": [
    { "question": "Genuine question about software for ${industryName.toLowerCase()}", "answer": "40-50 words, practical" },
    { "question": "Different angle — pricing, process, or timeline", "answer": "40-50 words" },
    { "question": "Different angle — technical or industry-specific", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate 3-5 FAQs. Each must be genuinely different — cover pricing, process, timeline, technical, and industry angles.`
}

function buildSolutionPrompt(problem: string, description: string): string {
  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background: Solo dev, ex-tradesman, practical style, Australian business, works Australia-wide.

## Page Context
**Solution:** ${problem}
**Description:** ${description}

## Voice: Direct, practical, first person ("I"). Australian English. No buzzwords.

Return valid JSON:
{
  "heroHeadline": "max 8 words",
  "heroSubheadline": "max 20 words",
  "problemStatement": "max 60 words",
  "solution": "max 60 words",
  "benefits": [
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" }
  ],
  "ctaText": "max 6 words",
  "faq": [
    { "question": "Genuine question about this solution", "answer": "40-50 words, practical" },
    { "question": "Different angle — pricing, process, or timeline", "answer": "40-50 words" },
    { "question": "Different angle — technical question", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate 3-5 FAQs. Each must be genuinely different.`
}

function buildComparisonPrompt(tool: string, category: string): string {
  return `You are writing landing page content for JARVE, a web development business run by James, based in Adelaide, Australia.

## Background: Solo dev, ex-tradesman, practical style, Australian business, works Australia-wide.

## Page Context
**Comparison:** Custom-built software vs ${tool} (${category})
Be fair and balanced. Explain when custom is better AND when ${tool} is the right choice.

## Voice: Direct, practical, first person ("I"). Australian English. No buzzwords.

Return valid JSON:
{
  "heroHeadline": "max 8 words",
  "heroSubheadline": "max 20 words",
  "problemStatement": "max 60 words about outgrowing ${tool}",
  "solution": "max 60 words about when custom makes sense",
  "benefits": [
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" },
    { "title": "3-4 words", "description": "max 25 words" }
  ],
  "ctaText": "max 6 words",
  "faq": [
    { "question": "Genuine question about custom vs ${tool}", "answer": "40-50 words, fair and practical" },
    { "question": "Different angle — migration, cost, or timeline", "answer": "40-50 words" },
    { "question": "Different angle — when to stick with ${tool}", "answer": "40-50 words" }
  ],
  "testimonialMatch": "15-word description of ideal testimonial"
}

Generate 3-5 FAQs. Each must be genuinely different.`
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

  // industries-city: 12 industries x 5 tier-1 cities = 60
  for (const industry of industries) {
    for (const city of tier1Cities) {
      const slug = `industry-${industry.slug}-${city.slug}`
      pages.push({
        slug,
        routePattern: 'industries-city',
        prompt: buildIndustryPrompt(industry.name, industry.painPoints, city.name, city.state, city.localDetails),
        metaTitle: `${industry.name} Software in ${city.name} | Jarve`,
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

const LAYOUTS = ['standard', 'problem-first', 'faq-heavy', 'benefits-grid', 'story-flow'] as const

function pickLayout(): string {
  return LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]
}

async function generateContent(page: PageDefinition): Promise<Record<string, unknown>> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: page.prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON found in response for ${page.slug}`)
  const content = JSON.parse(jsonMatch[0])

  // Normalize single FAQ to array (in case LLM returns old format)
  if (content.faq && !Array.isArray(content.faq)) {
    content.faq = [content.faq]
  }

  // Post-process: replace "we/We" with "I" (James is solo)
  // Catch-all: "We" or "we" followed by a verb-like word, plus contractions
  const fixWe = (str: string) => {
    return str
      .replace(/\bWe're\b/g, "I'm")
      .replace(/\bwe're\b/g, "I'm")
      .replace(/\bWe've\b/g, "I've")
      .replace(/\bwe've\b/g, "I've")
      .replace(/\bWe'll\b/g, "I'll")
      .replace(/\bwe'll\b/g, "I'll")
      .replace(/\bWe'd\b/g, "I'd")
      .replace(/\bwe'd\b/g, "I'd")
      .replace(/\bWe (?=[a-z])/g, 'I ')
      .replace(/\bwe (?=[a-z])/g, 'I ')
  }
  // Apply to all string fields
  for (const key of Object.keys(content)) {
    const val = content[key]
    if (typeof val === 'string') {
      content[key] = fixWe(val)
    } else if (Array.isArray(val)) {
      content[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return fixWe(item)
        if (item && typeof item === 'object') {
          const obj = { ...(item as Record<string, unknown>) }
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string') obj[k] = fixWe(obj[k] as string)
          }
          return obj
        }
        return item
      })
    }
  }

  // Assign random layout variant
  content.layout = pickLayout()

  return content
}

async function upsertPage(page: PageDefinition, content: Record<string, unknown>) {
  // Extract meta_description from content if available
  const metaDesc = typeof content.metaDescription === 'string'
    ? content.metaDescription
    : `${page.metaTitle.replace(' | Jarve', '')}. Australian developer, Adelaide-based, working Australia-wide.`

  const { error } = await supabase
    .from('seo_pages')
    .upsert(
      {
        route_pattern: page.routePattern,
        slug: page.slug,
        status: 'draft',
        content,
        meta_title: page.metaTitle,
        meta_description: metaDesc,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
  if (error) throw new Error(`Upsert failed for ${page.slug}: ${error.message}`)
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
      const content = await generateContent(page)
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

async function publish(slugPattern: string) {
  const { data, error } = await supabase
    .from('seo_pages')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .like('slug', slugPattern)
    .select('slug')

  if (error) {
    console.error(`Publish failed: ${error.message}`)
    return
  }
  console.log(`Published ${data?.length ?? 0} pages matching "${slugPattern}"`)
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
