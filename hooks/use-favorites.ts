'use client'

import { useState, useEffect, useCallback } from 'react'

export type FavoriteEntityType = 'lead' | 'client' | 'project' | 'employee'

export interface Favorite {
  id: string
  entityType: FavoriteEntityType
  entityId: string
  entityName: string
  entitySubtitle?: string
  createdAt: string
}

interface UseFavoritesReturn {
  favorites: Favorite[]
  isLoading: boolean
  error: string | null
  isFavorite: (entityType: FavoriteEntityType, entityId: string) => boolean
  addFavorite: (params: {
    entityType: FavoriteEntityType
    entityId: string
    entityName: string
    entitySubtitle?: string
  }) => Promise<void>
  removeFavorite: (entityType: FavoriteEntityType, entityId: string) => Promise<void>
  toggleFavorite: (params: {
    entityType: FavoriteEntityType
    entityId: string
    entityName: string
    entitySubtitle?: string
  }) => Promise<void>
  refresh: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        throw new Error('Failed to fetch favorites')
      }
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const isFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: string): boolean => {
      return favorites.some(
        (f) => f.entityType === entityType && f.entityId === entityId
      )
    },
    [favorites]
  )

  const addFavorite = useCallback(
    async (params: {
      entityType: FavoriteEntityType
      entityId: string
      entityName: string
      entitySubtitle?: string
    }) => {
      // Optimistic update
      const optimisticFavorite: Favorite = {
        id: `temp-${Date.now()}`,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        entitySubtitle: params.entitySubtitle,
        createdAt: new Date().toISOString(),
      }

      setFavorites((prev) => [optimisticFavorite, ...prev])
      setError(null)

      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          const data = await response.json()
          if (data.error) {
            throw new Error(data.error)
          }
          throw new Error('Failed to add favorite')
        }

        // Refresh to get the real data
        await fetchFavorites()
      } catch (err) {
        // Rollback optimistic update
        setFavorites((prev) => prev.filter((f) => f.id !== optimisticFavorite.id))
        setError(err instanceof Error ? err.message : 'Failed to add favorite')
        throw err
      }
    },
    [fetchFavorites]
  )

  const removeFavorite = useCallback(
    async (entityType: FavoriteEntityType, entityId: string) => {
      // Optimistic update
      const previousFavorites = favorites
      setFavorites((prev) =>
        prev.filter((f) => !(f.entityType === entityType && f.entityId === entityId))
      )
      setError(null)

      try {
        const response = await fetch(
          `/api/favorites?entityType=${entityType}&entityId=${entityId}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const data = await response.json()
          if (data.error) {
            throw new Error(data.error)
          }
          throw new Error('Failed to remove favorite')
        }
      } catch (err) {
        // Rollback optimistic update
        setFavorites(previousFavorites)
        setError(err instanceof Error ? err.message : 'Failed to remove favorite')
        throw err
      }
    },
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (params: {
      entityType: FavoriteEntityType
      entityId: string
      entityName: string
      entitySubtitle?: string
    }) => {
      if (isFavorite(params.entityType, params.entityId)) {
        await removeFavorite(params.entityType, params.entityId)
      } else {
        await addFavorite(params)
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  )

  return {
    favorites,
    isLoading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refresh: fetchFavorites,
  }
}
