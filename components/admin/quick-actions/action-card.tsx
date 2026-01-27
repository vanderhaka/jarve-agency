'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface ActionCardProps {
  icon: LucideIcon
  label: string
  shortcut: string
  onClick?: () => void
  href?: string
}

export function ActionCard({ icon: Icon, label, shortcut, onClick, href }: ActionCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-2 w-full">
        <div className="h-7 w-7 rounded-md flex items-center justify-center bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-mono pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
        {shortcut}
      </span>
    </>
  )

  if (href) {
    return (
      <Button
        variant="outline"
        className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
        asChild
      >
        <Link href={href}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-muted/50 transition-all group"
      onClick={onClick}
    >
      {content}
    </Button>
  )
}
