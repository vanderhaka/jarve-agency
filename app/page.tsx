import { HeroSection } from '@/components/hero-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { ServicesSection } from '@/components/services-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { PortfolioSection } from '@/components/portfolio-section'
import { WhyJarveSection } from '@/components/why-jarve-section'
import { AboutSection } from '@/components/about-section'
import { FAQSection } from '@/components/faq-section'
import { ContactForm } from '@/components/contact-form'
import { Footer } from '@/components/footer'
import { PricingSection } from '@/components/pricing-section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { FadeIn } from '@/components/fade-in'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ship_no_background.png"
              alt="JARVE"
              width={48}
              height={26}
              className="w-12 h-auto"
            />
            <span className="text-2xl font-bold tracking-tight">JARVE</span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Work
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Button asChild size="sm" className="rounded-full px-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 hover:shadow-lg hover:shadow-green-500/30 transition-all">
              <Link href="#contact">Book a Free Call</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button asChild size="sm" className="rounded-full px-5 bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 hover:shadow-lg hover:shadow-green-500/30 transition-all">
              <Link href="#contact">Book a Free Call</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <TestimonialsSection />
        <ServicesSection />
        <HowItWorksSection />
        <PortfolioSection />

        {/* Mid-page CTA */}
        <section className="py-16 px-4 text-center">
          <FadeIn>
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 transition-all">
              <Link href="#contact">Let&apos;s Talk About Your Project</Link>
            </Button>
          </FadeIn>
        </section>

        <WhyJarveSection />
        <PricingSection />
        <FAQSection />

        <section id="contact" className="py-24 px-4 bg-muted/30 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="container mx-auto max-w-2xl relative z-10">
            <FadeIn>
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Let&apos;s Talk About Your Project</h2>
                <p className="text-lg text-muted-foreground">
                  Book a free 15-minute call. No pressure, just a quick chat about what you&apos;re building.
                </p>
              </div>

              <ContactForm />
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

