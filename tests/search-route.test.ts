import { describe, it, expect } from 'vitest'

// Test pure functions and helpers for the search route
// Full integration tests would require mocking Supabase

describe('Search Route Helpers', () => {
  describe('escapeLikePattern', () => {
    // Mirror the function from search route
    function escapeLikePattern(str: string): string {
      return str.replace(/[%_\\]/g, '\\$&')
    }

    it('escapes percentage signs', () => {
      expect(escapeLikePattern('50%')).toBe('50\\%')
    })

    it('escapes underscores', () => {
      expect(escapeLikePattern('test_query')).toBe('test\\_query')
    })

    it('escapes backslashes', () => {
      expect(escapeLikePattern('path\\to\\file')).toBe('path\\\\to\\\\file')
    })

    it('escapes multiple special characters', () => {
      expect(escapeLikePattern('50%_discount\\')).toBe('50\\%\\_discount\\\\')
    })

    it('returns unchanged string without special characters', () => {
      expect(escapeLikePattern('normal search')).toBe('normal search')
    })

    it('handles empty string', () => {
      expect(escapeLikePattern('')).toBe('')
    })
  })

  describe('Search Result Formatting', () => {
    interface MilestoneSearchResult {
      id: string
      title: string
      project_id: string
      status: string
      amount: number
      agency_projects: { name: string } | null
    }

    interface ChangeRequestSearchResult {
      id: string
      title: string
      project_id: string
      status: string
      amount: number
      agency_projects: { name: string } | null
    }

    function formatMilestoneResult(milestone: MilestoneSearchResult) {
      const projectName = milestone.agency_projects?.name || 'Unknown Project'
      return {
        id: milestone.id,
        name: milestone.title,
        subtitle: `${projectName} • $${milestone.amount.toLocaleString()}`,
        type: 'milestone' as const,
        href: `/admin/projects/${milestone.project_id}?tab=milestones`,
      }
    }

    function formatChangeRequestResult(cr: ChangeRequestSearchResult) {
      const projectName = cr.agency_projects?.name || 'Unknown Project'
      return {
        id: cr.id,
        name: cr.title,
        subtitle: `${projectName} • $${cr.amount.toLocaleString()}`,
        type: 'change_request' as const,
        href: `/admin/projects/${cr.project_id}?tab=change-requests`,
      }
    }

    it('formats milestone result with project name', () => {
      const milestone: MilestoneSearchResult = {
        id: 'ms-1',
        title: 'Design Phase',
        project_id: 'proj-1',
        status: 'active',
        amount: 5000,
        agency_projects: { name: 'Website Redesign' },
      }

      const result = formatMilestoneResult(milestone)
      expect(result.name).toBe('Design Phase')
      expect(result.subtitle).toContain('Website Redesign')
      expect(result.subtitle).toContain('5,000')
      expect(result.type).toBe('milestone')
      expect(result.href).toBe('/admin/projects/proj-1?tab=milestones')
    })

    it('formats milestone result without project name', () => {
      const milestone: MilestoneSearchResult = {
        id: 'ms-2',
        title: 'Development',
        project_id: 'proj-2',
        status: 'planned',
        amount: 10000,
        agency_projects: null,
      }

      const result = formatMilestoneResult(milestone)
      expect(result.subtitle).toContain('Unknown Project')
    })

    it('formats change request result with project name', () => {
      const cr: ChangeRequestSearchResult = {
        id: 'cr-1',
        title: 'Additional Features',
        project_id: 'proj-1',
        status: 'sent',
        amount: 2500,
        agency_projects: { name: 'Mobile App' },
      }

      const result = formatChangeRequestResult(cr)
      expect(result.name).toBe('Additional Features')
      expect(result.subtitle).toContain('Mobile App')
      expect(result.subtitle).toContain('2,500')
      expect(result.type).toBe('change_request')
      expect(result.href).toBe('/admin/projects/proj-1?tab=change-requests')
    })

    it('formats change request result without project name', () => {
      const cr: ChangeRequestSearchResult = {
        id: 'cr-2',
        title: 'Scope Change',
        project_id: 'proj-2',
        status: 'draft',
        amount: 1500,
        agency_projects: null,
      }

      const result = formatChangeRequestResult(cr)
      expect(result.subtitle).toContain('Unknown Project')
    })
  })

  describe('Search Term Construction', () => {
    function buildSearchTerm(query: string): string {
      const escapedQuery = query.trim().replace(/[%_\\]/g, '\\$&')
      return `%${escapedQuery}%`
    }

    it('wraps query in wildcards', () => {
      expect(buildSearchTerm('test')).toBe('%test%')
    })

    it('trims whitespace before wrapping', () => {
      expect(buildSearchTerm('  test  ')).toBe('%test%')
    })

    it('escapes special characters within wildcards', () => {
      expect(buildSearchTerm('50% off')).toBe('%50\\% off%')
    })
  })
})

describe('Search Result Type Filtering', () => {
  type SearchResultType = 'lead' | 'client' | 'project' | 'employee' | 'milestone' | 'change_request'

  interface SearchResult {
    id: string
    name: string
    type: SearchResultType
  }

  function groupResultsByType(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
    const groups: Record<SearchResultType, SearchResult[]> = {
      lead: [],
      client: [],
      project: [],
      employee: [],
      milestone: [],
      change_request: [],
    }

    for (const result of results) {
      groups[result.type].push(result)
    }

    return groups
  }

  it('groups results by type', () => {
    const results: SearchResult[] = [
      { id: '1', name: 'Test Lead', type: 'lead' },
      { id: '2', name: 'Test Milestone', type: 'milestone' },
      { id: '3', name: 'Test Lead 2', type: 'lead' },
      { id: '4', name: 'Test CR', type: 'change_request' },
    ]

    const grouped = groupResultsByType(results)
    expect(grouped.lead).toHaveLength(2)
    expect(grouped.milestone).toHaveLength(1)
    expect(grouped.change_request).toHaveLength(1)
    expect(grouped.client).toHaveLength(0)
  })

  it('handles empty results', () => {
    const grouped = groupResultsByType([])
    expect(grouped.lead).toHaveLength(0)
    expect(grouped.milestone).toHaveLength(0)
    expect(grouped.change_request).toHaveLength(0)
  })
})
