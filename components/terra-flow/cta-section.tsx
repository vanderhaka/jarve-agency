import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/terra-flow/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 z-0">
        <Image src="/terra-flow/images/cta-bg.jpg" alt="Studio atmosphere" fill className="object-cover" />
        <div className="absolute inset-0 bg-primary/80" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-light text-primary-foreground mb-6 text-balance">
          Begin Your <span className="font-semibold">Transformation</span>
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
          Your first class is on us. Experience the Terra Flow difference and discover what mindful movement can do for
          your body and mind.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/projects/terra-flow/schedule">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-sm uppercase tracking-widest px-8 py-6 w-full sm:w-auto"
            >
              Book Your Free Class
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/projects/terra-flow/team">
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-sm uppercase tracking-widest px-8 py-6 bg-transparent w-full sm:w-auto"
            >
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
