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
  // For "/admin" (dashboard), use exact match
  // For other routes, use starts-with match
  const isActive = href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-2',
        isActive
          ? 'bg-gray-900 text-white shadow dark:bg-white dark:text-gray-900'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  )
}
