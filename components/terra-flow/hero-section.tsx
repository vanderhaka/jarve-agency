import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/terra-flow/images/hero-bg.jpg" alt="Terra Flow Pilates Studio" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <p className="text-primary uppercase tracking-[0.3em] text-sm font-medium">Mind · Body · Movement</p>
          <h1 className="text-5xl md:text-7xl font-light leading-tight text-balance">
            Find Your <br />
            <span className="font-semibold text-primary">Center</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Transform your practice through mindful movement. Our intimate studio offers personalized pilates classes
            designed to strengthen, lengthen, and restore.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/projects/terra-flow/packages">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm uppercase tracking-widest px-8 py-6 w-full sm:w-auto"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects/terra-flow/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 text-sm uppercase tracking-widest px-8 py-6 bg-transparent w-full sm:w-auto"
              >
                View Schedule
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
            <Image src="/terra-flow/images/hero-woman.jpg" alt="Pilates practice" fill className="object-cover" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</span>
        <div className="w-px h-12 bg-primary/40" />
      </div>
    </section>
  )
}
