import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure URL-safe token.
 * Used for portal access tokens, proposal signing tokens, etc.
 */
export function generateSecureToken(): string {
  return randomBytes(24).toString('base64url')
}
