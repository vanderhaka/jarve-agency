import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { SeoContent } from './types'

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8">
      <ol className="flex items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
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

export function SeoPageSections({ content }: { content: SeoContent }) {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.heroHeadline}</h1>
          <p className="text-lg text-muted-foreground">{content.heroSubheadline}</p>
        </div>
      </section>

      {/* City Context */}
      {content.cityContext && (
        <section className="py-8 border-b">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">{content.cityContext}</p>
          </div>
        </section>
      )}

      {/* Problem */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">The Problem</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{content.problemStatement}</p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">How I Can Help</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{content.solution}</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8">What You Get</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.benefits.map((benefit, i) => (
              <div key={i} className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Signals */}
      {content.localSignals && content.localSignals.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Working With Me</h2>
            <ul className="space-y-3">
              {content.localSignals.map((signal, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-primary font-bold">—</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      {content.faq && (
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-lg font-semibold mb-2">{content.faq.question}</h2>
            <p className="text-muted-foreground">{content.faq.answer}</p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Button asChild size="lg">
            <Link href="/#contact">{content.ctaText}</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
