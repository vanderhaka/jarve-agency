import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function DiggableCaseStudy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/#portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Work
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">Diggable</h1>
        <p className="text-lg text-muted-foreground mb-8">Marketplace · 10 weeks</p>

        <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-12 border">
          <Image
            src="/portfolio/diggable.png"
            alt="Diggable marketplace screenshot"
            fill
            className="object-cover object-top"
          />
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-3">Challenge</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Jonathan Butler had a 20-year vision for connecting buyers with architectural salvage dealers across Australia. He needed a marketplace that could handle thousands of listings from multiple shops — but had no technical team to build it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Solution</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A full marketplace platform where dealers list vintage fixtures, fireplace mantels, and reclaimed materials. Buyers browse, search, and connect with trusted shops nationwide. Built with Next.js and Supabase for speed and scale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Result</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Launched in 10 weeks. Live and growing with dealers onboarding across the country.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t space-y-4">
          <Button asChild size="lg" className="w-full h-14 rounded-full text-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:scale-[1.02] transition-all">
            <Link href="/#contact">Want something similar? Let&apos;s talk</Link>
          </Button>
          <a
            href="https://diggable.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Visit live site <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
