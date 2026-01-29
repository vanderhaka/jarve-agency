/**
 * Simple in-memory rate limiter for serverless.
 * Limits requests per IP within a sliding window.
 * Note: resets on cold start. Upgrade to Upstash for persistent limits.
 */

const requests = new Map<string, number[]>()

export function rateLimit(
  ip: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: boolean; remaining: number } {
  const now = Date.now()
  const timestamps = requests.get(ip) ?? []

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < windowMs)

  if (valid.length >= limit) {
    requests.set(ip, valid)
    return { ok: false, remaining: 0 }
  }

  valid.push(now)
  requests.set(ip, valid)
  return { ok: true, remaining: limit - valid.length }
}
