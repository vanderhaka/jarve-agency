import { randomBytes } from 'crypto'

// ============================================================
// Helpers (Pure utility functions - no 'use server' needed)
// ============================================================

export function generatePortalToken(): string {
  return randomBytes(24).toString('base64url')
}
