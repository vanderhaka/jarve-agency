import Anthropic from '@anthropic-ai/sdk'

// Re-export types for convenience
export type { SeoContent } from './types'

const LAYOUTS = ['standard', 'problem-first', 'faq-heavy', 'benefits-grid', 'story-flow', 'testimonial-heavy'] as const

/**
 * Post-processes generated content to replace "we/our" language with first-person
 * and remove corporate buzzwords per JARVE voice guidelines.
 */
export function fixVoice(str: string): string {
  return str
    .replace(/\bWe're\b/g, "I'm")
    .replace(/\bwe're\b/g, "I'm")
    .replace(/\bWe've\b/g, "I've")
    .replace(/\bwe've\b/g, "I've")
    .replace(/\bWe'll\b/g, "I'll")
    .replace(/\bwe'll\b/g, "I'll")
    .replace(/\bWe'd\b/g, "I'd")
    .replace(/\bwe'd\b/g, "I'd")
    .replace(/\bWe are\b/g, 'I am')
    .replace(/\bwe are\b/g, 'I am')
    .replace(/\bWe were\b/g, 'I was')
    .replace(/\bwe were\b/g, 'I was')
    .replace(/\bWe (?=[a-z])/g, 'I ')
    .replace(/\bwe (?=[a-z])/g, 'I ')
    .replace(/\b[Oo]ur team\b/g, 'I')
    .replace(/\b[Oo]ur company\b/g, 'my business')
    .replace(/\b[Oo]ur experts?\b/g, 'I')
    .replace(/\b[Oo]ur developers?\b/g, 'I')
    .replace(/\b[Oo]ur specialists?\b/g, 'I')
    .replace(/\bcutting-edge\b/gi, 'modern')
    .replace(/\binnovative\b/gi, 'practical')
    .replace(/\bleverage\b/gi, 'use')
    .replace(/\bsynergy\b/gi, 'collaboration')
    .replace(/\bindustry-leading\b/gi, 'solid')
    .replace(/\bbest-in-class\b/gi, 'reliable')
    .replace(/\bworld-class\b/gi, 'quality')
    .replace(/^Let's /g, '')
    .replace(/^Let us /g, '')
}

/**
 * Randomly selects a layout variant for content generation.
 * This ensures variety across generated pages.
 */
export function pickLayout(): string {
  return LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]
}

/**
 * Extract the first balanced JSON object from text.
 * Counts braces to avoid greedy regex issues.
 */
function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON found in response')

  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') depth--
    if (depth === 0) {
      return JSON.parse(text.slice(start, i + 1))
    }
  }
  throw new Error('Unbalanced JSON in response')
}

/**
 * Recursively apply fixVoice to all string values in an object.
 */
function applyVoiceFix(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string') {
      result[key] = fixVoice(val)
    } else if (Array.isArray(val)) {
      result[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return fixVoice(item)
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return applyVoiceFix(item as Record<string, unknown>)
        }
        return item
      })
    } else if (val && typeof val === 'object') {
      result[key] = applyVoiceFix(val as Record<string, unknown>)
    } else {
      result[key] = val
    }
  }
  return result
}

/**
 * Generates SEO content using Claude Sonnet 4.
 *
 * @param prompt - The complete prompt including context, requirements, and JSON schema
 * @returns Parsed JSON content with voice fixes applied and layout assigned
 */
export async function generateContent(prompt: string): Promise<Record<string, unknown>> {
  const anthropic = new Anthropic()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const content = extractJson(text)

  // Normalize FAQ to always be an array
  if (content.faq && !Array.isArray(content.faq)) {
    content.faq = [content.faq]
  }

  // Apply fixVoice recursively to all string fields
  const fixed = applyVoiceFix(content)

  // Assign random layout
  fixed.layout = pickLayout()

  return fixed
}
