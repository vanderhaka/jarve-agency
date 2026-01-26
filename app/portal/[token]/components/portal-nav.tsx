'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, FileText, Upload } from 'lucide-react'
import { usePortal } from './portal-context'
import { ProjectSwitcher } from './project-switcher'
import { cn } from '@/lib/utils'

export function PortalNav() {
  const { manifest, token } = usePortal()
  const pathname = usePathname()
  const basePath = `/portal/${token}`

  const navItems = [
    { href: basePath, label: 'Home', icon: Home },
    { href: `${basePath}/chat`, label: 'Messages', icon: MessageSquare },
    { href: `${basePath}/docs`, label: 'Documents', icon: FileText },
    { href: `${basePath}/uploads`, label: 'Uploads', icon: Upload },
  ]

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Client name */}
          <div className="flex items-center gap-4">
            <Link href={basePath} className="font-semibold text-lg">
              {manifest.client.company || manifest.client.name}
            </Link>
            {manifest.projects.length > 1 && <ProjectSwitcher />}
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
