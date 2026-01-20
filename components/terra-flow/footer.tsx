import Link from "next/link"
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Terra Flow</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              A pilates studio dedicated to mindful movement and holistic wellness.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/70 hover:text-background transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@terraflow.com"
                className="text-background/70 hover:text-background transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-widest font-medium">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/projects/terra-flow" className="text-background/70 hover:text-background transition-colors text-sm">
                Home
              </Link>
              <Link href="/projects/terra-flow/schedule" className="text-background/70 hover:text-background transition-colors text-sm">
                Class Schedule
              </Link>
              <Link href="/projects/terra-flow/team" className="text-background/70 hover:text-background transition-colors text-sm">
                Our Team
              </Link>
              <Link href="/projects/terra-flow/packages" className="text-background/70 hover:text-background transition-colors text-sm">
                Pricing
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-widest font-medium">Classes</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/projects/terra-flow/schedule" className="text-background/70 hover:text-background transition-colors text-sm">
                Foundation Flow
              </Link>
              <Link href="/projects/terra-flow/schedule" className="text-background/70 hover:text-background transition-colors text-sm">
                Reformer Sculpt
              </Link>
              <Link href="/projects/terra-flow/schedule" className="text-background/70 hover:text-background transition-colors text-sm">
                Power Pilates
              </Link>
              <Link href="/projects/terra-flow/packages" className="text-background/70 hover:text-background transition-colors text-sm">
                Private Sessions
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-widest font-medium">Contact</h4>
            <div className="space-y-3">
              <p className="text-background/70 text-sm flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                123 Wellness Lane
                <br />
                Brooklyn, NY 11201
              </p>
              <a
                href="tel:5551234567"
                className="text-background/70 hover:text-background text-sm flex items-center gap-2 transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" />
                (555) 123-4567
              </a>
              <a
                href="mailto:hello@terraflow.com"
                className="text-background/70 hover:text-background text-sm flex items-center gap-2 transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" />
                hello@terraflow.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">© 2025 Terra Flow Pilates. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/projects/terra-flow/privacy" className="text-background/50 hover:text-background transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/projects/terra-flow/terms" className="text-background/50 hover:text-background transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
