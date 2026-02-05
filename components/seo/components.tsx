'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/fade-in'
import type { SeoContent } from '@/lib/seo/types'

// Normalize legacy single-FAQ to array
function normalizeFaq(faq: SeoContent['faq']): { question: string; answer: string }[] {
  if (!faq) return []
  if (Array.isArray(faq)) return faq
  return [faq as unknown as { question: string; answer: string }]
}

// --- Individual sections ---

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8">
      <ol className="flex items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function HeroSection({ content }: { content: SeoContent }) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        <FadeIn>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {content.heroHeadline}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
            {content.heroSubheadline}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

function CityContextSection({ content }: { content: SeoContent }) {
  if (!content.cityContext) return null
  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeIn>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            {content.cityContext}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

function ProblemSection({ content }: { content: SeoContent }) {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(var(--primary-rgb,59,130,246),0.05),transparent_50%)]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">The Problem</h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            {content.problemStatement}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

function SolutionSection({ content }: { content: SeoContent }) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">How I Can Help</h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            {content.solution}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

function BenefitsSection({ content, large }: { content: SeoContent; large?: boolean }) {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary-rgb,59,130,246),0.05),transparent_50%)]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        <FadeIn>
          <h2 className={`font-bold tracking-tight mb-10 ${large ? 'text-3xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
            What You Get
          </h2>
        </FadeIn>
        <div className="grid gap-6 md:grid-cols-3">
          {content.benefits.map((benefit, i) => (
            <FadeIn key={i} delay={0.1 * (i + 1)}>
              <div className={`rounded-xl border border-border/50 bg-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 ${large ? 'p-8' : 'p-6'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className={`font-semibold ${large ? 'text-lg' : ''}`}>{benefit.title}</h3>
                </div>
                <p className={`text-muted-foreground ${large ? 'text-base' : 'text-sm'}`}>
                  {benefit.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function LocalSignalsSection({ content }: { content: SeoContent }) {
  if (!content.localSignals || content.localSignals.length === 0) return null
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Working With Me</h2>
        </FadeIn>
        <ul className="space-y-4 max-w-3xl">
          {content.localSignals.map((signal, i) => (
            <FadeIn key={i} delay={0.1 * (i + 1)}>
              <li className="flex gap-4 text-muted-foreground">
                <span className="text-primary font-bold text-lg">&mdash;</span>
                <span className="text-lg leading-relaxed">{signal}</span>
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FaqSection({ content, prominent }: { content: SeoContent; prominent?: boolean }) {
  const faqs = normalizeFaq(content.faq)
  if (faqs.length === 0) return null
  return (
    <section className={`relative overflow-hidden ${prominent ? 'py-24' : 'py-20'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        <FadeIn>
          <h2 className={`font-bold tracking-tight mb-10 ${prominent ? 'text-3xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
            {prominent ? 'Common Questions' : 'FAQ'}
          </h2>
        </FadeIn>
        <div className="space-y-6 max-w-3xl">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={0.1 * (i + 1)}>
              <div className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-colors">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function CombinedContextProblem({ content }: { content: SeoContent }) {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(var(--primary-rgb,59,130,246),0.05),transparent_50%)]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        {content.cityContext && (
          <FadeIn>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              {content.cityContext}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">The Problem</h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            {content.problemStatement}
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

function TestimonialsSection({ content }: { content: SeoContent }) {
  if (!content.testimonialMatch) return null

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb,59,130,246),0.05),transparent_50%)]" />
      <div className="container mx-auto px-4 max-w-5xl relative">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center">
            What Clients Say
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-border/50 bg-card p-8 md:p-10 max-w-3xl mx-auto shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-lg md:text-xl leading-relaxed italic">
                  &ldquo;{content.testimonialMatch}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function InternalLinksSection({ links }: { links: { title: string; href: string; group: string }[] }) {
  if (!links || links.length === 0) return null

  // Group links by their group label
  const grouped = links.reduce<Record<string, { title: string; href: string }[]>>((acc, link) => {
    if (!acc[link.group]) acc[link.group] = []
    acc[link.group].push({ title: link.title, href: link.href })
    return acc
  }, {})

  return (
    <section className="py-16 border-t border-border/50">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeIn>
          <h2 className="text-2xl font-bold tracking-tight mb-8">Related Pages</h2>
        </FadeIn>
        <div className="grid gap-8 md:grid-cols-2">
          {Object.entries(grouped).map(([group, groupLinks]) => (
            <FadeIn key={group}>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {group}
                </h3>
                <ul className="space-y-2">
                  {groupLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection({ content }: { content: SeoContent }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <FadeIn>
          <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all">
            <Link href="/#contact">{content.ctaText}</Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  )
}

// --- Layout variants ---

export function SeoPageSections({ content }: { content: SeoContent }) {
  const layout = content.layout ?? 'standard'

  switch (layout) {
    case 'problem-first':
      return (
        <>
          <HeroSection content={content} />
          <ProblemSection content={content} />
          <SolutionSection content={content} />
          <CityContextSection content={content} />
          <BenefitsSection content={content} />
          <FaqSection content={content} />
          <LocalSignalsSection content={content} />
          <CtaSection content={content} />
        </>
      )

    case 'faq-heavy':
      return (
        <>
          <HeroSection content={content} />
          <CityContextSection content={content} />
          <FaqSection content={content} prominent />
          <ProblemSection content={content} />
          <SolutionSection content={content} />
          <BenefitsSection content={content} />
          <LocalSignalsSection content={content} />
          <CtaSection content={content} />
        </>
      )

    case 'benefits-grid':
      return (
        <>
          <HeroSection content={content} />
          <BenefitsSection content={content} large />
          <ProblemSection content={content} />
          <SolutionSection content={content} />
          <CityContextSection content={content} />
          <FaqSection content={content} />
          <LocalSignalsSection content={content} />
          <CtaSection content={content} />
        </>
      )

    case 'story-flow':
      return (
        <>
          <HeroSection content={content} />
          <CombinedContextProblem content={content} />
          <SolutionSection content={content} />
          <LocalSignalsSection content={content} />
          <BenefitsSection content={content} />
          <FaqSection content={content} />
          <CtaSection content={content} />
        </>
      )

    case 'testimonial-heavy':
      return (
        <>
          <HeroSection content={content} />
          <TestimonialsSection content={content} />
          <ProblemSection content={content} />
          <SolutionSection content={content} />
          <BenefitsSection content={content} />
          <FaqSection content={content} />
          <CtaSection content={content} />
        </>
      )

    default: // 'standard'
      return (
        <>
          <HeroSection content={content} />
          <CityContextSection content={content} />
          <ProblemSection content={content} />
          <SolutionSection content={content} />
          <BenefitsSection content={content} />
          <LocalSignalsSection content={content} />
          <FaqSection content={content} />
          <CtaSection content={content} />
        </>
      )
  }
}
