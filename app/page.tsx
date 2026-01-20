import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { ServicesSection } from '@/components/services-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { PortfolioSection } from '@/components/portfolio-section'
import { WhyJarveSection } from '@/components/why-jarve-section'
import { FAQSection } from '@/components/faq-section'
import { ContactForm } from '@/components/contact-form'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            JARVE
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
            <Link href="#portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Work
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Button asChild variant="default" size="sm" className="rounded-full px-6">
              <Link href="#contact">Book a Call</Link>
            </Button>
          </nav>
          <div className="md:hidden">
             <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <TestimonialsSection />
        <ServicesSection />
        <HowItWorksSection />
        <PortfolioSection />
        <WhyJarveSection />

        <section className="py-32 px-4 bg-[#1a1f2e] text-white relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl" />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

          <FadeIn>
            <div className="container mx-auto text-center max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Development</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Ready to{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">launch</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-white/30 -z-10 rounded" />
                </span>
                {' '}your app?
              </h2>

              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Most agencies quote $100K+ and 6 months. We&apos;ll build it for a fraction of that—and have you live in weeks.
              </p>

              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg bg-white text-[#1a1f2e] hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300 group">
                <Link href="#contact" className="flex items-center gap-2">
                  Book a Free Call
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </section>

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

