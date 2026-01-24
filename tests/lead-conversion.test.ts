import { describe, expect, it, vi } from 'vitest'
import {
  validateLeadForConversion,
  normalizeEmail,
  performLeadConversion,
  performArchiveLead,
  performRestoreLead,
  type Lead,
  type LeadConversionClient,
  type ConvertLeadInput,
} from '@/lib/leads/conversion'

// Helper to create a mock lead
function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    name: 'Test Lead',
    email: 'test@example.com',
    company: 'Test Company',
    message: 'Test message',
    status: 'new',
    converted_at: null,
    archived_at: null,
    ...overrides,
  }
}

// Helper to create a mock client with customizable behavior
function createMockClient(overrides: Partial<LeadConversionClient> = {}): LeadConversionClient {
  return {
    getLead: vi.fn(async () => ({ data: createMockLead(), error: null })),
    findClientByEmail: vi.fn(async () => ({ data: null, error: null })),
    createClient: vi.fn(async () => ({ data: { id: 'client-1' }, error: null })),
    createClientUser: vi.fn(async () => ({ error: null })),
    createProject: vi.fn(async () => ({ data: { id: 'project-1' }, error: null })),
    updateLead: vi.fn(async () => ({ error: null })),
    archiveLead: vi.fn(async () => ({ error: null })),
    restoreLead: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('validateLeadForConversion', () => {
  it('returns invalid when lead is null', () => {
    const result = validateLeadForConversion(null)
    expect(result).toEqual({ valid: false, message: 'Lead not found' })
  })

  it('returns invalid when lead has no name', () => {
    const lead = createMockLead({ name: null })
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: false, message: 'Lead must have a name to convert' })
  })

  it('returns invalid when lead name is empty string', () => {
    const lead = createMockLead({ name: '   ' })
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: false, message: 'Lead must have a name to convert' })
  })

  it('returns invalid when lead has no email', () => {
    const lead = createMockLead({ email: null })
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: false, message: 'Lead must have an email to convert' })
  })

  it('returns invalid when lead email is empty string', () => {
    const lead = createMockLead({ email: '  ' })
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: false, message: 'Lead must have an email to convert' })
  })

  it('returns invalid when lead is already converted', () => {
    const lead = createMockLead({ converted_at: '2026-01-23T00:00:00Z' })
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: false, message: 'This lead has already been converted' })
  })

  it('returns valid for a complete lead', () => {
    const lead = createMockLead()
    const result = validateLeadForConversion(lead)
    expect(result).toEqual({ valid: true })
  })
})

describe('normalizeEmail', () => {
  it('converts email to lowercase', () => {
    expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
  })

  it('trims whitespace', () => {
    expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com')
  })

  it('handles mixed case with whitespace', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com')
  })
})

describe('performLeadConversion', () => {
  const defaultInput: ConvertLeadInput = {
    projectName: 'Test Project',
    projectType: 'web',
    projectStatus: 'planning',
    assignedTo: null,
  }

  it('returns error when lead fetch fails', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({ data: null, error: { message: 'DB error' } })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to fetch lead')
  })

  it('returns error when lead not found', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({ data: null, error: null })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Lead not found')
  })

  it('returns error when lead has no email', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({ data: createMockLead({ email: null }), error: null })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Lead must have an email to convert')
  })

  it('returns error when lead already converted', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({
        data: createMockLead({ converted_at: '2026-01-23T00:00:00Z' }),
        error: null,
      })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('This lead has already been converted')
  })

  it('creates new client when no existing client matches email', async () => {
    const client = createMockClient()

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(true)
    expect(result.linkedExisting).toBe(false)
    expect(client.createClient).toHaveBeenCalledWith({
      name: 'Test Lead',
      email: 'test@example.com',
      company: 'Test Company',
    })
  })

  it('links to existing client when email matches (case-insensitive)', async () => {
    const client = createMockClient({
      findClientByEmail: vi.fn(async () => ({
        data: { id: 'existing-client-1', name: 'Existing Client' },
        error: null,
      })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(true)
    expect(result.linkedExisting).toBe(true)
    expect(result.clientId).toBe('existing-client-1')
    expect(result.message).toContain('Linked to existing client')
    expect(client.createClient).not.toHaveBeenCalled()
  })

  it('creates client_user after client creation', async () => {
    const client = createMockClient()

    await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(client.createClientUser).toHaveBeenCalledWith({
      client_id: 'client-1',
      name: 'Test Lead',
      email: 'test@example.com',
    })
  })

  it('continues even if client_user creation fails', async () => {
    const client = createMockClient({
      createClientUser: vi.fn(async () => ({ error: { message: 'Duplicate email' } })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    // Should still succeed
    expect(result.success).toBe(true)
  })

  it('returns error when client creation fails', async () => {
    const client = createMockClient({
      createClient: vi.fn(async () => ({ data: null, error: { message: 'DB error' } })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to create client')
  })

  it('creates project with correct data', async () => {
    const client = createMockClient()
    const input: ConvertLeadInput = {
      projectName: 'Custom Project Name',
      projectType: 'mobile',
      projectStatus: 'in_progress',
      assignedTo: 'emp-2',
    }

    await performLeadConversion(client, 'lead-1', input, 'emp-1')

    expect(client.createProject).toHaveBeenCalledWith({
      name: 'Custom Project Name',
      type: 'mobile',
      status: 'in_progress',
      client_id: 'client-1',
      assigned_to: 'emp-2',
      description: 'Test message',
    })
  })

  it('uses lead name as project name if not provided', async () => {
    const client = createMockClient()
    const input: ConvertLeadInput = {
      projectName: '',
      projectType: 'web',
      projectStatus: 'planning',
    }

    await performLeadConversion(client, 'lead-1', input, 'emp-1')

    expect(client.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Lead',
      })
    )
  })

  it('returns error when project creation fails', async () => {
    const client = createMockClient({
      createProject: vi.fn(async () => ({ data: null, error: { message: 'DB error' } })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to create project')
  })

  it('updates lead with conversion data', async () => {
    const client = createMockClient()

    await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(client.updateLead).toHaveBeenCalledWith('lead-1', {
      status: 'converted',
      client_id: 'client-1',
      project_id: 'project-1',
      converted_at: expect.any(String),
      archived_at: expect.any(String),
      archived_by: 'emp-1',
    })
  })

  it('returns error when lead update fails', async () => {
    const client = createMockClient({
      updateLead: vi.fn(async () => ({ error: { message: 'DB error' } })),
    })

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to update lead status')
  })

  it('returns success with client and project IDs', async () => {
    const client = createMockClient()

    const result = await performLeadConversion(client, 'lead-1', defaultInput, 'emp-1')

    expect(result.success).toBe(true)
    expect(result.clientId).toBe('client-1')
    expect(result.projectId).toBe('project-1')
  })
})

describe('performArchiveLead', () => {
  it('archives lead successfully', async () => {
    const client = createMockClient()

    const result = await performArchiveLead(client, 'lead-1', 'emp-1')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Lead archived successfully')
    expect(client.archiveLead).toHaveBeenCalledWith('lead-1', 'emp-1')
  })

  it('returns error when archive fails', async () => {
    const client = createMockClient({
      archiveLead: vi.fn(async () => ({ error: { message: 'DB error' } })),
    })

    const result = await performArchiveLead(client, 'lead-1', 'emp-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to archive lead')
  })
})

describe('performRestoreLead', () => {
  it('restores lead successfully', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({ data: createMockLead({ archived_at: '2026-01-23' }), error: null })),
    })

    const result = await performRestoreLead(client, 'lead-1')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Lead restored successfully')
    expect(client.restoreLead).toHaveBeenCalledWith('lead-1')
  })

  it('returns error when lead was converted', async () => {
    const client = createMockClient({
      getLead: vi.fn(async () => ({
        data: createMockLead({ converted_at: '2026-01-23', archived_at: '2026-01-23' }),
        error: null,
      })),
    })

    const result = await performRestoreLead(client, 'lead-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Cannot restore a converted lead')
    expect(client.restoreLead).not.toHaveBeenCalled()
  })

  it('returns error when restore fails', async () => {
    const client = createMockClient({
      restoreLead: vi.fn(async () => ({ error: { message: 'DB error' } })),
    })

    const result = await performRestoreLead(client, 'lead-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to restore lead')
  })
})
