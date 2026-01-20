"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/terra-flow/ui/button"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/projects/terra-flow" className="text-2xl font-semibold tracking-wide text-foreground">
          Terra Flow
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/projects/terra-flow"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/projects/terra-flow/schedule"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Schedule
          </Link>
          <Link
            href="/projects/terra-flow/packages"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Packages
          </Link>
          <Link
            href="/projects/terra-flow/team"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Our Team
          </Link>
          <Link
            href="/projects/terra-flow/profile"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <User size={18} />
          </Link>
          <Link href="/projects/terra-flow/schedule">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-sm px-6">
              Book a Class
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <nav className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
          <Link
            href="/projects/terra-flow"
            className="text-sm uppercase tracking-widest text-foreground py-2"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/projects/terra-flow/schedule"
            className="text-sm uppercase tracking-widest text-foreground py-2"
            onClick={() => setIsOpen(false)}
          >
            Schedule
          </Link>
          <Link
            href="/projects/terra-flow/packages"
            className="text-sm uppercase tracking-widest text-foreground py-2"
            onClick={() => setIsOpen(false)}
          >
            Packages
          </Link>
          <Link
            href="/projects/terra-flow/team"
            className="text-sm uppercase tracking-widest text-foreground py-2"
            onClick={() => setIsOpen(false)}
          >
            Our Team
          </Link>
          <Link
            href="/projects/terra-flow/profile"
            className="text-sm uppercase tracking-widest text-foreground py-2"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>
          <Link href="/projects/terra-flow/schedule" onClick={() => setIsOpen(false)}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-sm mt-4 w-full">
              Book a Class
            </Button>
          </Link>
        </nav>
      )}
    </header>
  )
}
