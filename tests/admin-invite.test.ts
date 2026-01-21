import { describe, expect, it } from 'vitest'
import {
  buildConfirmRedirectUrl,
  resolveSiteUrlFromHeaders,
  validateInvitePayload,
} from '@/lib/admin/invite'

describe('validateInvitePayload', () => {
  it('rejects missing email or name', () => {
    const result = validateInvitePayload({ email: '', name: 'Jane' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Please provide a full name and email address.')
    }
  })

  it('rejects invalid email format', () => {
    const result = validateInvitePayload({ email: 'not-an-email', name: 'Jane' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Please provide a valid email address.')
    }
  })

  it('rejects invalid role', () => {
    const result = validateInvitePayload({
      email: 'jane@example.com',
      name: 'Jane',
      role: 'owner',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBe('Please select a valid role.')
    }
  })

  it('normalizes email and uses default role', () => {
    const result = validateInvitePayload({
      email: '  JANE@Example.com ',
      name: '  Jane Doe  ',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.email).toBe('jane@example.com')
      expect(result.name).toBe('Jane Doe')
      expect(result.role).toBe('employee')
    }
  })
})

describe('resolveSiteUrlFromHeaders', () => {
  it('prefers env site url', () => {
    const result = resolveSiteUrlFromHeaders(
      { origin: 'https://origin.test', host: 'host.test' },
      'https://env.test'
    )
    expect(result).toBe('https://env.test')
  })

  it('uses origin header when available', () => {
    const result = resolveSiteUrlFromHeaders({
      origin: 'https://origin.test',
      host: 'host.test',
    })
    expect(result).toBe('https://origin.test')
  })

  it('builds from forwarded host/proto when origin missing', () => {
    const result = resolveSiteUrlFromHeaders({
      'x-forwarded-host': 'forwarded.test',
      'x-forwarded-proto': 'http',
    })
    expect(result).toBe('http://forwarded.test')
  })

  it('builds from host with https default', () => {
    const result = resolveSiteUrlFromHeaders({ host: 'host.test' })
    expect(result).toBe('https://host.test')
  })

  it('returns null when no host info', () => {
    const result = resolveSiteUrlFromHeaders({})
    expect(result).toBeNull()
  })
})

describe('buildConfirmRedirectUrl', () => {
  it('builds auth confirm url with next param', () => {
    const result = buildConfirmRedirectUrl('https://app.test', '/login')
    expect(result).toBe('https://app.test/auth/confirm?next=%2Flogin')
  })
})
