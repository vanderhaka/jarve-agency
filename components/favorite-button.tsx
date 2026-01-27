'use client'

import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites, type FavoriteEntityType } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FavoriteButtonProps {
  entityType: FavoriteEntityType
  entityId: string
  entityName: string
  entitySubtitle?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?: 'ghost' | 'outline' | 'default'
  className?: string
}

export function FavoriteButton({
  entityType,
  entityId,
  entityName,
  entitySubtitle,
  size = 'icon',
  variant = 'ghost',
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites()
  const [isPending, setIsPending] = useState(false)

  const favorited = isFavorite(entityType, entityId)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (isPending || isLoading) return

    setIsPending(true)
    try {
      await toggleFavorite({
        entityType,
        entityId,
        entityName,
        entitySubtitle,
      })
    } catch {
      // Error handled in hook
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={cn('transition-colors', className)}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={cn(
          'h-4 w-4 transition-all',
          favorited && 'fill-yellow-400 text-yellow-400',
          isPending && 'animate-pulse'
        )}
      />
    </Button>
  )
}
