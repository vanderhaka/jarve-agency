'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/terra-flow/utils'

interface NavLinkProps {
  href: string
  icon?: LucideIcon
  children: React.ReactNode
}

export function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()

  // Determine if this link is active
  // For "/app", use exact match
  // For other routes, use starts-with match
  const isActive = href === '/app'
    ? pathname === '/app'
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  )
}
