import { FAQSection } from '@/components/faq-section'
import { QualitySignalsSection } from '@/components/quality-signals-section'
import { FadeIn } from '@/components/fade-in'
import Link from 'next/link'
import '@/components/v2/v2.css'
import { V2Header } from '@/components/v2/v2-header'
import { V2HeroSection } from '@/components/v2/v2-hero-section'
import { V2Footer } from '@/components/v2/v2-footer'
import { V2AboutSection } from '@/components/v2/v2-about-section'
import { V2TestimonialsSection } from '@/components/v2/v2-testimonials-section'
import { V2ServicesSection } from '@/components/v2/v2-services-section'
import { V2HowItWorksSection } from '@/components/v2/v2-how-it-works'
import { V2PortfolioSection } from '@/components/v2/v2-portfolio-section'
import { V2WhyJarveSection } from '@/components/v2/v2-why-jarve-section'
import { V2PricingSection } from '@/components/v2/v2-pricing-section'
import { V2ContactForm } from '@/components/v2/v2-contact-form'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans theme-earthy">
      <V2Header />
      <main className="flex-1">
        <V2HeroSection />
        <V2AboutSection />
        <V2TestimonialsSection />
        <V2ServicesSection />
        <V2HowItWorksSection />
        <V2PortfolioSection />

        {/* Mid-page CTA */}
        <section className="py-16 px-4 text-center">
          <FadeIn>
            <Link
              href="#contact"
              className="inline-flex items-center h-14 px-8 rounded-full text-lg font-medium bg-[hsl(140,18%,38%)] text-white shadow-md hover:shadow-lg hover:bg-[hsl(140,18%,33%)] hover:scale-105 transition-all"
            >
              Let&apos;s Talk About Your Project
            </Link>
          </FadeIn>
        </section>

        <V2WhyJarveSection />
        <V2PricingSection />
        <QualitySignalsSection />
        <FAQSection />

        <section id="contact" className="py-24 px-4 bg-muted/30 relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="container mx-auto max-w-2xl relative z-10">
            <FadeIn>
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Let&apos;s Talk About Your Project</h2>
                <p className="text-lg text-muted-foreground">
                  Book a free 15-minute call. No pressure, just a quick chat about what you&apos;re building.
                </p>
              </div>

              <V2ContactForm />
            </FadeIn>
          </div>
        </section>
      </main>
      <V2Footer />
    </div>
  )
}
