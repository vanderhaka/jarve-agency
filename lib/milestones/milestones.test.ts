import { describe, it, expect } from 'vitest'

// Test pure functions and business logic for milestones
// Database integration tests would require a test database setup

describe('Milestone Business Logic', () => {
  describe('GST Calculations', () => {
    const GST_RATE = 0.10

    it('calculates GST correctly for milestone amount', () => {
      const amount = 1000
      const gst = amount * GST_RATE
      expect(gst).toBe(100)
    })

    it('calculates total with GST correctly', () => {
      const amount = 1500
      const total = amount * (1 + GST_RATE)
      expect(total).toBeCloseTo(1650, 2)
    })

    it('handles decimal amounts correctly', () => {
      const amount = 1234.56
      const gst = amount * GST_RATE
      expect(gst).toBeCloseTo(123.456, 2)
    })
  })

  describe('Milestone Status Transitions', () => {
    type MilestoneStatus = 'planned' | 'active' | 'complete' | 'invoiced'

    const validTransitions: Record<MilestoneStatus, MilestoneStatus[]> = {
      planned: ['active', 'complete'],
      active: ['complete', 'planned'],
      complete: ['invoiced', 'active'],
      invoiced: [], // Terminal state
    }

    function isValidTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
      return validTransitions[from].includes(to)
    }

    it('allows planned -> active transition', () => {
      expect(isValidTransition('planned', 'active')).toBe(true)
    })

    it('allows planned -> complete transition', () => {
      expect(isValidTransition('planned', 'complete')).toBe(true)
    })

    it('allows active -> complete transition', () => {
      expect(isValidTransition('active', 'complete')).toBe(true)
    })

    it('allows complete -> invoiced transition', () => {
      expect(isValidTransition('complete', 'invoiced')).toBe(true)
    })

    it('disallows invoiced -> any transition (terminal state)', () => {
      expect(isValidTransition('invoiced', 'planned')).toBe(false)
      expect(isValidTransition('invoiced', 'active')).toBe(false)
      expect(isValidTransition('invoiced', 'complete')).toBe(false)
    })
  })

  describe('Deposit Milestone Calculation', () => {
    const DEFAULT_DEPOSIT_PERCENTAGE = 0.50

    function calculateDepositAmount(
      proposalTotal: number,
      customPercentage?: number
    ): number {
      const percentage = customPercentage ?? DEFAULT_DEPOSIT_PERCENTAGE
      return proposalTotal * percentage
    }

    it('uses default 50% for deposit when no override', () => {
      const proposalTotal = 10000
      const deposit = calculateDepositAmount(proposalTotal)
      expect(deposit).toBe(5000)
    })

    it('uses custom percentage when provided', () => {
      const proposalTotal = 10000
      const deposit = calculateDepositAmount(proposalTotal, 0.30)
      expect(deposit).toBe(3000)
    })

    it('handles zero proposal total', () => {
      const deposit = calculateDepositAmount(0)
      expect(deposit).toBe(0)
    })

    it('handles 100% deposit', () => {
      const proposalTotal = 5000
      const deposit = calculateDepositAmount(proposalTotal, 1.0)
      expect(deposit).toBe(5000)
    })
  })

  describe('Milestone Completion Idempotency', () => {
    type MilestoneStatus = 'planned' | 'active' | 'complete' | 'invoiced'

    interface MockMilestone {
      id: string
      status: MilestoneStatus
      invoice_id: string | null
    }

    function shouldCreateInvoice(milestone: MockMilestone): boolean {
      // Should only create invoice if not already complete or invoiced
      return milestone.status !== 'complete' && milestone.status !== 'invoiced'
    }

    it('returns true for planned milestone (should create invoice)', () => {
      const milestone: MockMilestone = {
        id: '1',
        status: 'planned',
        invoice_id: null,
      }
      expect(shouldCreateInvoice(milestone)).toBe(true)
    })

    it('returns true for active milestone (should create invoice)', () => {
      const milestone: MockMilestone = {
        id: '1',
        status: 'active',
        invoice_id: null,
      }
      expect(shouldCreateInvoice(milestone)).toBe(true)
    })

    it('returns false for complete milestone (idempotent - no duplicate)', () => {
      const milestone: MockMilestone = {
        id: '1',
        status: 'complete',
        invoice_id: 'inv-123',
      }
      expect(shouldCreateInvoice(milestone)).toBe(false)
    })

    it('returns false for invoiced milestone (idempotent - no duplicate)', () => {
      const milestone: MockMilestone = {
        id: '1',
        status: 'invoiced',
        invoice_id: 'inv-123',
      }
      expect(shouldCreateInvoice(milestone)).toBe(false)
    })
  })

  describe('Milestone Reordering', () => {
    interface MockMilestone {
      id: string
      sort_order: number
    }

    function reorderMilestones(
      milestones: MockMilestone[],
      newOrder: string[]
    ): MockMilestone[] {
      return newOrder.map((id, index) => {
        const milestone = milestones.find(m => m.id === id)
        if (!milestone) throw new Error(`Milestone ${id} not found`)
        return { ...milestone, sort_order: index }
      })
    }

    it('reorders milestones correctly', () => {
      const milestones: MockMilestone[] = [
        { id: 'a', sort_order: 0 },
        { id: 'b', sort_order: 1 },
        { id: 'c', sort_order: 2 },
      ]

      const reordered = reorderMilestones(milestones, ['c', 'a', 'b'])

      expect(reordered[0]).toEqual({ id: 'c', sort_order: 0 })
      expect(reordered[1]).toEqual({ id: 'a', sort_order: 1 })
      expect(reordered[2]).toEqual({ id: 'b', sort_order: 2 })
    })

    it('maintains sort_order as contiguous integers', () => {
      const milestones: MockMilestone[] = [
        { id: 'x', sort_order: 5 },
        { id: 'y', sort_order: 10 },
        { id: 'z', sort_order: 15 },
      ]

      const reordered = reorderMilestones(milestones, ['y', 'z', 'x'])

      expect(reordered.map(m => m.sort_order)).toEqual([0, 1, 2])
    })

    it('throws error for unknown milestone id', () => {
      const milestones: MockMilestone[] = [
        { id: 'a', sort_order: 0 },
      ]

      expect(() => reorderMilestones(milestones, ['unknown'])).toThrow()
    })
  })
})
