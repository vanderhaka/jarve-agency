'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export function V2Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b sticky top-0 z-50 bg-[hsl(40,20%,97%)]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[hsl(40,20%,97%)]/60">
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
          <Link
            href="#contact"
            className="inline-flex items-center h-9 px-6 rounded-full text-sm font-medium bg-[hsl(140,18%,38%)] text-white hover:bg-[hsl(140,18%,33%)] hover:shadow-md transition-all"
          >
            Request a Call
          </Link>
        </nav>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <Link href="#about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
              About
            </Link>
            <Link href="#portfolio" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
              Work
            </Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
              Pricing
            </Link>
            <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
              Contact
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center h-9 px-6 rounded-full text-sm font-medium bg-[hsl(140,18%,38%)] text-white hover:bg-[hsl(140,18%,33%)] transition-all mt-2"
            >
              Request a Call
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
