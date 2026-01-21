/**
 * Calculate new position for task reordering
 * Uses fractional positioning for efficient reordering without reindexing
 */
export function calculateNewPosition(
  prevPosition: number | null,
  nextPosition: number | null
): number {
  if (prevPosition === null && nextPosition === null) {
    // Empty column, start at 1
    return 1
  }

  if (prevPosition === null) {
    // Moving to top - place before the first item
    return nextPosition! - 1
  }

  if (nextPosition === null) {
    // Moving to bottom - place after the last item
    return prevPosition + 1
  }

  // Moving between two tasks - place in the middle
  return (prevPosition + nextPosition) / 2
}
