/**
 * Standard result type for server actions.
 * Provides type-safe success/error handling.
 */
export type ActionResult<T = void> =
  | ({ success: true; message: string } & T)
  | { success: false; message: string; code?: string }

/**
 * Unwrap a Supabase join result that may be an array or single value.
 * Supabase returns arrays for some joins and single values for others.
 */
export function unwrapJoinResult<T>(data: T | T[] | null | undefined): T | null {
  if (data === null || data === undefined) return null
  if (Array.isArray(data)) return data[0] ?? null
  return data
}
