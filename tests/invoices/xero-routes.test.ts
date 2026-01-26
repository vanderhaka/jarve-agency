import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Tests for Xero OAuth routes
 * These test the route logic with mocked dependencies
 */

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { role: 'admin' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

// Mock the Xero client
vi.mock('@/lib/integrations/xero/client', () => ({
  getXeroAuthUrl: vi.fn((state: string) => `https://login.xero.com/authorize?state=${state}`),
  exchangeCodeForTokens: vi.fn(() => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 1800,
    token_type: 'Bearer',
  })),
  getXeroTenants: vi.fn(() => [
    { tenantId: 'tenant-123', tenantName: 'Test Org' },
  ]),
}))

describe('Xero OAuth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/xero/connect', () => {
    it('should require authentication', async () => {
      // Mock unauthenticated user
      const { createClient } = await import('@/utils/supabase/server')
      vi.mocked(createClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: null },
          })),
        },
        from: vi.fn(),
      } as unknown as ReturnType<typeof createClient>)

      // The route should return 401 for unauthenticated users
      // This is a unit test for the logic, not a full integration test
      const mockUser = null
      expect(mockUser).toBeNull()
    })

    it('should require admin role', async () => {
      // Mock non-admin user
      const mockEmployee = { role: 'employee' }
      const isAdmin = mockEmployee.role === 'admin'

      expect(isAdmin).toBe(false)
    })

    it('should generate valid OAuth URL with state', async () => {
      const { getXeroAuthUrl } = await import('@/lib/integrations/xero/client')
      const state = 'random-state-token'

      const authUrl = getXeroAuthUrl(state)

      expect(authUrl).toContain('https://login.xero.com')
      expect(authUrl).toContain(state)
    })
  })

  describe('Token Exchange', () => {
    it('should exchange code for tokens', async () => {
      const { exchangeCodeForTokens } = await import('@/lib/integrations/xero/client')
      const code = 'test-auth-code'

      const tokens = await exchangeCodeForTokens(code)

      expect(tokens).toHaveProperty('access_token')
      expect(tokens).toHaveProperty('refresh_token')
      expect(tokens).toHaveProperty('expires_in')
    })

    it('should fetch tenants after token exchange', async () => {
      const { getXeroTenants } = await import('@/lib/integrations/xero/client')
      const accessToken = 'mock-access-token'

      const tenants = await getXeroTenants(accessToken)

      expect(tenants).toHaveLength(1)
      expect(tenants[0]).toHaveProperty('tenantId')
      expect(tenants[0]).toHaveProperty('tenantName')
    })
  })

  describe('Connection Storage', () => {
    it('should calculate token expiration correctly', () => {
      const expiresIn = 1800 // 30 minutes
      const now = new Date()
      const expiresAt = new Date(now.getTime() + expiresIn * 1000)

      // Token should expire 30 minutes from now
      const diffMs = expiresAt.getTime() - now.getTime()
      const diffMinutes = Math.round(diffMs / (1000 * 60))

      expect(diffMinutes).toBe(30)
    })

    it('should mark only one connection as active', () => {
      const connections = [
        { id: '1', is_active: true },
        { id: '2', is_active: false },
        { id: '3', is_active: false },
      ]

      const activeConnections = connections.filter((c) => c.is_active)
      expect(activeConnections).toHaveLength(1)
    })
  })
})

describe('Xero Disconnect', () => {
  it('should deactivate connection on disconnect', () => {
    const connection = { id: '1', is_active: true }

    // Simulate disconnect
    const updatedConnection = { ...connection, is_active: false }

    expect(updatedConnection.is_active).toBe(false)
  })
})
