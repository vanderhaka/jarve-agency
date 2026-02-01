'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

export interface RankingFiltersState {
  positionBucket: string
  cityTier: string
  trend: string
}

interface RankingFiltersProps {
  filters: RankingFiltersState
  onChange: (filters: RankingFiltersState) => void
}

export default function RankingFilters({ filters, onChange }: RankingFiltersProps) {
  const handlePositionChange = (value: string) => {
    onChange({ ...filters, positionBucket: value })
  }

  const handleCityTierChange = (value: string) => {
    onChange({ ...filters, cityTier: value })
  }

  const handleTrendChange = (value: string) => {
    onChange({ ...filters, trend: value })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Position Range</label>
            <Select value={filters.positionBucket} onValueChange={handlePositionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                <SelectItem value="top3">Top 3</SelectItem>
                <SelectItem value="4-10">4-10</SelectItem>
                <SelectItem value="11-20">11-20</SelectItem>
                <SelectItem value="21-50">21-50</SelectItem>
                <SelectItem value="51-100">51-100</SelectItem>
                <SelectItem value="not-ranking">Not ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">City Tier</label>
            <Select value={filters.cityTier} onValueChange={handleCityTierChange}>
              <SelectTrigger>
                <SelectValue placeholder="All tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="tier1">Tier 1</SelectItem>
                <SelectItem value="tier2">Tier 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Trend</label>
            <Select value={filters.trend} onValueChange={handleTrendChange}>
              <SelectTrigger>
                <SelectValue placeholder="All trends" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trends</SelectItem>
                <SelectItem value="improving">Improving</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
