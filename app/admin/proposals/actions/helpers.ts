import { randomBytes } from 'crypto'

// ============================================================
// Helpers (Pure utility functions - no 'use server' needed)
// ============================================================

export function generatePortalToken(): string {
  // Use cryptographically secure random bytes for token generation
  return randomBytes(24).toString('base64url')
}
