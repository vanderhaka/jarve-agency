import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure alphanumeric token.
 * Uses hex encoding to guarantee [a-f0-9] output only.
 * Used for portal access tokens, proposal signing tokens, etc.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}
