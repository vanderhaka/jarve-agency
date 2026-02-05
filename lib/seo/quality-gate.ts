import type { SeoContent } from './types'

interface QualityResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Quality gate for SEO content - validates content before publishing
 * Blocks on false claims, pronouns, missing fields, word counts, and buzzwords
 * Warns on generic CTAs, low FAQ count, and meta description issues
 */
export function runQualityGate(content: SeoContent): QualityResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Regex patterns
  const falseClaimsRegex = /I've built|I've worked with|worked with.*Sydney|my clients in|I've helped/i
  const wePronouns = /\bwe\b|\bour\b/i
  const buzzwords = /\bsynergy\b|\bcutting-edge\b|\binnovative\b|\bleverage\b|\bindustry-leading\b|\bbest-in-class\b|\bworld-class\b|\bgame-changer\b|\bdisruptive\b|\bparadigm\b/i
  const htmlTags = /<\/?[a-z][\s\S]*?>/i

  // Helper to check all string values recursively
  const checkStringValue = (
    value: unknown,
    path: string,
    regex: RegExp,
    errorMsg: string
  ): void => {
    if (typeof value === 'string' && regex.test(value)) {
      errors.push(`${errorMsg} at ${path}: "${value.match(regex)?.[0]}"`)
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, val]) => {
            checkStringValue(val, `${path}[${idx}].${key}`, regex, errorMsg)
          })
        } else {
          checkStringValue(item, `${path}[${idx}]`, regex, errorMsg)
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkStringValue(val, `${path}.${key}`, regex, errorMsg)
      })
    }
  }

  // Check false claims across all content
  checkStringValue(content, 'content', falseClaimsRegex, 'False claim detected')

  // Check "we" pronouns in James's voice only (not customer-voiced FAQ questions)
  const contentWithoutFaqQuestions = { ...content }
  if (contentWithoutFaqQuestions.faq) {
    contentWithoutFaqQuestions.faq = content.faq.map(f => ({ ...f, question: '' }))
  }
  checkStringValue(contentWithoutFaqQuestions, 'content', wePronouns, '"We/our" pronoun detected (James is solo operator)')

  // Check buzzwords across all content
  checkStringValue(content, 'content', buzzwords, 'Buzzword detected')

  // Check for HTML tags in content (AI sometimes generates HTML)
  checkStringValue(content, 'content', htmlTags, 'HTML tag detected in content')

  // Required field checks
  if (!content.heroHeadline?.trim()) {
    errors.push('Missing required field: heroHeadline')
  }
  if (!content.heroSubheadline?.trim()) {
    errors.push('Missing required field: heroSubheadline')
  }
  if (!content.problemStatement?.trim()) {
    errors.push('Missing required field: problemStatement')
  }
  if (!content.solution?.trim()) {
    errors.push('Missing required field: solution')
  }
  if (!content.ctaText?.trim()) {
    errors.push('Missing required field: ctaText')
  }
  if (!content.benefits || content.benefits.length === 0) {
    errors.push('Missing required field: benefits (must have at least 1)')
  }
  if (!content.faq || content.faq.length === 0) {
    errors.push('Missing required field: faq (must have at least 1)')
  }

  // Word count violations
  const wordCount = (text: string): number => {
    const trimmed = text.trim()
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  }

  if (content.heroHeadline && wordCount(content.heroHeadline) > 10) {
    errors.push(
      `heroHeadline exceeds 10 words (${wordCount(content.heroHeadline)} words)`
    )
  }
  if (content.heroSubheadline && wordCount(content.heroSubheadline) > 25) {
    errors.push(
      `heroSubheadline exceeds 25 words (${wordCount(content.heroSubheadline)} words)`
    )
  }
  if (content.problemStatement && wordCount(content.problemStatement) > 80) {
    errors.push(
      `problemStatement exceeds 80 words (${wordCount(content.problemStatement)} words)`
    )
  }
  if (content.solution && wordCount(content.solution) > 80) {
    errors.push(
      `solution exceeds 80 words (${wordCount(content.solution)} words)`
    )
  }

  // Warning checks
  const genericCtaPatterns = /^(get started|contact us|learn more|click here|read more|find out more|discover more|start now|try now)$/i
  if (content.ctaText && genericCtaPatterns.test(content.ctaText.trim())) {
    warnings.push(`Generic CTA detected: "${content.ctaText}" - consider more specific copy`)
  }

  if (content.faq && content.faq.length < 3) {
    warnings.push(`Low FAQ count: ${content.faq.length} (recommended: 3+)`)
  }

  if (!content.metaDescription?.trim()) {
    warnings.push('Missing metaDescription')
  } else if (content.metaDescription.length > 160) {
    warnings.push(
      `metaDescription too long: ${content.metaDescription.length} chars (recommended: ≤160)`
    )
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}
