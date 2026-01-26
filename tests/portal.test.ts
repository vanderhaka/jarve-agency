import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Mock the supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
}

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

vi.mock('@/utils/supabase/anon', () => ({
  createAnonClient: vi.fn(() => mockSupabaseClient),
}))

// Helper to create chainable query mocks
function createQueryMock(data: unknown, error: { message: string } | null = null) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  // For queries that don't use .single()
  mock.select.mockImplementation(() => ({
    ...mock,
    then: (resolve: (value: { data: unknown; error: unknown }) => void) =>
      resolve({ data: Array.isArray(data) ? data : [data], error }),
  }))
  return mock
}

describe('Portal Token Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should deny access for revoked token', async () => {
    // Setup mock to return revoked token (revoked_at is not null)
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_portal_tokens') {
        return createQueryMock(null, { message: 'Token not found' })
      }
      return createQueryMock(null)
    })

    // Import the function after mocking
    const { getPortalManifest } = await import('@/lib/integrations/portal/actions')

    const result = await getPortalManifest('revoked-token')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid or revoked token')
    }
  })

  it('should allow access for valid token', async () => {
    // Setup mock responses for valid token flow
    const tokenData = {
      id: 'token-1',
      client_user_id: 'client-user-1',
      view_count: 5,
    }

    const clientUserData = {
      id: 'client-user-1',
      name: 'Test User',
      email: 'test@example.com',
      client_id: 'client-1',
    }

    const clientData = {
      id: 'client-1',
      name: 'Test Client',
      company: 'Test Company',
    }

    const projectsData = [
      { id: 'project-1', name: 'Project 1', status: 'active', created_at: '2024-01-01' },
      { id: 'project-2', name: 'Project 2', status: 'completed', created_at: '2024-01-02' },
    ]

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_portal_tokens') {
        const mock = createQueryMock(tokenData)
        // Override update to not break chain
        mock.update = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })
        return mock
      }
      if (table === 'client_users') {
        return createQueryMock(clientUserData)
      }
      if (table === 'clients') {
        return createQueryMock(clientData)
      }
      if (table === 'agency_projects') {
        const mock = createQueryMock(projectsData)
        mock.order = vi.fn().mockResolvedValue({ data: projectsData, error: null })
        return mock
      }
      if (table === 'portal_read_state') {
        return createQueryMock(null)
      }
      if (table === 'portal_messages') {
        return createQueryMock([], null)
      }
      return createQueryMock(null)
    })

    const { getPortalManifest } = await import('@/lib/integrations/portal/actions')

    const result = await getPortalManifest('valid-token')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.manifest.clientUser.name).toBe('Test User')
      expect(result.manifest.client.name).toBe('Test Client')
      expect(result.manifest.projects.length).toBe(2)
    }
  })
})

describe('Portal Messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should post message and return it', async () => {
    const newMessage = {
      id: 'msg-1',
      project_id: 'project-1',
      author_type: 'client',
      author_id: 'client-user-1',
      body: 'Test message',
      created_at: new Date().toISOString(),
    }

    const tokenData = {
      id: 'token-1',
      client_user_id: 'client-user-1',
    }

    const clientUserData = {
      id: 'client-user-1',
      client_id: 'client-1',
    }

    const projectData = { id: 'project-1' }

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_portal_tokens') {
        return createQueryMock(tokenData)
      }
      if (table === 'client_users') {
        return createQueryMock(clientUserData)
      }
      if (table === 'agency_projects') {
        return createQueryMock(projectData)
      }
      if (table === 'portal_messages') {
        const mock = createQueryMock(newMessage)
        mock.insert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newMessage, error: null }),
          }),
        })
        return mock
      }
      return createQueryMock(null)
    })

    const { postPortalMessage } = await import('@/lib/integrations/portal/actions')

    const result = await postPortalMessage('valid-token', 'project-1', 'Test message')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.message.body).toBe('Test message')
      expect(result.message.author_type).toBe('client')
    }
  })
})

describe('Portal Read State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update read state when viewing messages', async () => {
    const tokenData = {
      id: 'token-1',
      client_user_id: 'client-user-1',
    }

    const clientUserData = {
      id: 'client-user-1',
      client_id: 'client-1',
    }

    const projectData = { id: 'project-1' }

    let upsertCalled = false

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_portal_tokens') {
        return createQueryMock(tokenData)
      }
      if (table === 'client_users') {
        return createQueryMock(clientUserData)
      }
      if (table === 'agency_projects') {
        return createQueryMock(projectData)
      }
      if (table === 'portal_read_state') {
        return {
          upsert: vi.fn().mockImplementation(() => {
            upsertCalled = true
            return Promise.resolve({ error: null })
          }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return createQueryMock(null)
    })

    const { updateReadState } = await import('@/lib/integrations/portal/actions')

    const result = await updateReadState('valid-token', 'project-1')

    expect(result.success).toBe(true)
    expect(upsertCalled).toBe(true)
  })
})

describe('Client Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new token and revoke old ones', async () => {
    const clientUserData = { id: 'client-user-1', name: 'Test User' }
    const newTokenData = {
      id: 'new-token-id',
      client_user_id: 'client-user-1',
      token: 'new-random-token',
      view_count: 0,
    }

    let updateCalled = false

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_users') {
        return createQueryMock(clientUserData)
      }
      if (table === 'client_portal_tokens') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newTokenData, error: null }),
            }),
          }),
          update: vi.fn().mockImplementation(() => {
            updateCalled = true
            return {
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: clientUserData, error: null }),
        }
      }
      return createQueryMock(null)
    })

    const { createClientPortalToken } = await import('@/lib/integrations/portal/client')

    const result = await createClientPortalToken('client-user-1')

    expect(result.success).toBe(true)
    expect(updateCalled).toBe(true) // Old tokens should be revoked
    if (result.success) {
      expect(result.url).toContain('/portal/')
    }
  })

  it('should revoke token by id', async () => {
    let updateCalled = false

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'client_portal_tokens') {
        return {
          update: vi.fn().mockImplementation(() => {
            updateCalled = true
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
        }
      }
      return createQueryMock(null)
    })

    const { revokeClientPortalToken } = await import('@/lib/integrations/portal/client')

    const result = await revokeClientPortalToken('token-id-to-revoke')

    expect(result.success).toBe(true)
    expect(updateCalled).toBe(true)
  })
})
