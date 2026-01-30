import Anthropic from '@anthropic-ai/sdk'

// Re-export types for convenience
export type { SeoContent } from './types'

const LAYOUTS = ['standard', 'problem-first', 'faq-heavy', 'benefits-grid', 'story-flow'] as const

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
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  const content = JSON.parse(jsonMatch[0])

  // Normalize FAQ to always be an array
  if (content.faq && !Array.isArray(content.faq)) {
    content.faq = [content.faq]
  }

  // Apply fixVoice to all string fields
  for (const key of Object.keys(content)) {
    const val = content[key]
    if (typeof val === 'string') {
      content[key] = fixVoice(val)
    } else if (Array.isArray(val)) {
      content[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return fixVoice(item)
        if (item && typeof item === 'object') {
          const obj = { ...(item as Record<string, unknown>) }
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string') obj[k] = fixVoice(obj[k] as string)
          }
          return obj
        }
        return item
      })
    }
  }

  // Assign random layout
  content.layout = pickLayout()

  return content
}
