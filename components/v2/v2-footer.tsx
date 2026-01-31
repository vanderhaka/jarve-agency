import Link from 'next/link'
import Image from 'next/image'

export function V2Footer() {
  return (
    <footer className="relative bg-[hsl(30,10%,10%)] text-white overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      {/* Sage glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-[hsl(140,18%,38%)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-[hsl(35,25%,40%)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/ship_no_background.png" alt="JARVE" width={40} height={22} className="w-10 h-auto brightness-0 invert" />
              <span className="text-xl font-bold tracking-tight">JARVE</span>
            </Link>
            <p className="text-sm text-[hsl(30,8%,55%)] max-w-xs">
              Custom web apps & internal tools for businesses that have outgrown spreadsheets.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[hsl(30,8%,55%)]">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link href="#about" className="text-sm text-[hsl(30,8%,65%)] hover:text-white transition-colors">About</Link>
              <Link href="#portfolio" className="text-sm text-[hsl(30,8%,65%)] hover:text-white transition-colors">Work</Link>
              <Link href="#pricing" className="text-sm text-[hsl(30,8%,65%)] hover:text-white transition-colors">Pricing</Link>
              <Link href="#contact" className="text-sm text-[hsl(30,8%,65%)] hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[hsl(30,8%,55%)]">Get in Touch</h3>
            <p className="text-sm text-[hsl(30,8%,65%)]">
              Ready to build something great?
            </p>
            <Link
              href="#contact"
              className="inline-flex items-center h-9 px-6 rounded-full text-sm font-medium bg-[hsl(140,18%,38%)] text-white hover:bg-[hsl(140,18%,33%)] transition-all"
            >
              Request a Call
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-xs text-[hsl(30,8%,45%)]">
            © {new Date().getFullYear()} Jarve. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
