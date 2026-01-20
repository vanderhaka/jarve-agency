import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { ServicesSection } from '@/components/services-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { PortfolioSection } from '@/components/portfolio-section'
import { ContactForm } from '@/components/contact-form'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'

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
              <Link href="#contact">Start Project</Link>
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
        <ServicesSection />
        <HowItWorksSection />
        <PortfolioSection />
        
        <section className="py-32 px-4 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          <FadeIn>
            <div className="container mx-auto text-center max-w-3xl relative z-10">
               <h2 className="text-3xl md:text-5xl font-bold mb-6">What could you build for 5x less?</h2>
               <p className="text-xl opacity-90 mb-8">
                 The project that was out of reach last year is now within budget. Let&apos;s talk about what&apos;s possible.
               </p>
               <Button asChild size="lg" variant="secondary" className="h-14 px-8 rounded-full text-lg shadow-lg">
                 <Link href="#contact">Book a Free Strategy Call</Link>
               </Button>
            </div>
          </FadeIn>
        </section>

        <section id="contact" className="py-24 px-4 bg-background">
          <div className="container mx-auto max-w-4xl">
            <FadeIn>
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                  <h2 className="text-4xl font-bold mb-6">Get in touch</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Fill out the form and we&apos;ll get back to you within 24 hours. We&apos;re excited to hear about your project.
                  </p>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                         <span className="text-xl">📧</span>
                       </div>
                       <div>
                         <div className="font-semibold">Email Us</div>
                         <div className="text-muted-foreground">hello@jarve.agency</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                         <span className="text-xl">📍</span>
                       </div>
                       <div>
                         <div className="font-semibold">Based in</div>
                         <div className="text-muted-foreground">Adelaide, SA</div>
                       </div>
                     </div>
                  </div>
                </div>
                <ContactForm />
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

