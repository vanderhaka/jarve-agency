'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
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

        {/* Desktop Navigation */}
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
            <Link href="#contact">Request a Call</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              About
            </Link>
            <Link
              href="#portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Work
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Pricing
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Contact
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-full px-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 hover:shadow-lg hover:shadow-green-500/30 transition-all mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="#contact">Request a Call</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
