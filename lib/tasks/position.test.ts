import { describe, it, expect } from 'vitest'
import { calculateNewPosition } from './position'

describe('calculateNewPosition', () => {
  it('returns 1 for empty column (both null)', () => {
    expect(calculateNewPosition(null, null)).toBe(1)
  })

  it('places before first item when moving to top', () => {
    // Moving to top, first item at position 2
    expect(calculateNewPosition(null, 2)).toBe(1)
    // Moving to top, first item at position 5
    expect(calculateNewPosition(null, 5)).toBe(4)
    // Moving to top, first item at position 1
    expect(calculateNewPosition(null, 1)).toBe(0)
  })

  it('places after last item when moving to bottom', () => {
    // Moving to bottom, last item at position 3
    expect(calculateNewPosition(3, null)).toBe(4)
    // Moving to bottom, last item at position 10
    expect(calculateNewPosition(10, null)).toBe(11)
  })

  it('places in middle when between two tasks', () => {
    // Between positions 1 and 2
    expect(calculateNewPosition(1, 2)).toBe(1.5)
    // Between positions 1 and 3
    expect(calculateNewPosition(1, 3)).toBe(2)
    // Between positions 2.5 and 3
    expect(calculateNewPosition(2.5, 3)).toBe(2.75)
  })

  it('handles fractional positions correctly', () => {
    // Already fractional
    expect(calculateNewPosition(1.5, 2)).toBe(1.75)
    expect(calculateNewPosition(1, 1.5)).toBe(1.25)
    expect(calculateNewPosition(1.25, 1.5)).toBe(1.375)
  })

  it('handles negative positions when moving to top of low-numbered items', () => {
    // First item at 0
    expect(calculateNewPosition(null, 0)).toBe(-1)
    // First item at -5
    expect(calculateNewPosition(null, -5)).toBe(-6)
  })
})
