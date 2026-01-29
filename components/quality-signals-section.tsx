'use client'

import { FadeIn } from '@/components/fade-in'

export function QualitySignalsSection() {
  return (
    <section className="py-16 px-4 border-t">
      <div className="container mx-auto">
        <FadeIn>
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Built to Last</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Every project includes: Automated testing • Security best practices • Full documentation & handoff • 30-day post-launch support
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
