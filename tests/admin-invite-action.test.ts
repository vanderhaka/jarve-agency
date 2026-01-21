import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  performEmployeeInvite,
  type InviteAdminClient,
  type InviteSupabaseClient,
} from '@/lib/admin/invite'

function createSupabaseMock(
  resolver: (fn: string) => { data: unknown; error: { message: string } | null }
): InviteSupabaseClient {
  return {
    rpc: vi.fn(async (fn: string) => resolver(fn)) as InviteSupabaseClient['rpc'],
  }
}

type AdminOverrides = {
  inviteUserByEmail?: ReturnType<typeof vi.fn>
  deleteUser?: ReturnType<typeof vi.fn>
}

function createAdminClientMock(overrides?: AdminOverrides): InviteAdminClient {
  const inviteUserByEmail = overrides?.inviteUserByEmail ?? vi.fn(async () => ({
    data: { user: { id: 'user-1' } },
    error: null,
  }))
  const deleteUser = overrides?.deleteUser ?? vi.fn(async () => ({ error: null }))

  return {
    auth: {
      admin: {
        inviteUserByEmail: inviteUserByEmail as InviteAdminClient['auth']['admin']['inviteUserByEmail'],
        deleteUser: deleteUser as InviteAdminClient['auth']['admin']['deleteUser'],
      },
    },
  }
}

describe('performEmployeeInvite', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('returns error when email check fails', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: null, error: { message: 'fail' } }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock()

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'employee',
    })

    expect(result.status).toBe('error')
    expect(result.message).toBe('Unable to validate the email right now. Please try again.')
    expect(adminClient.auth.admin.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('returns error when email is unavailable', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: { available: false, reason: 'already used' }, error: null }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock()

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'employee',
    })

    expect(result.status).toBe('error')
    expect(result.message).toBe('already used')
    expect(adminClient.auth.admin.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('returns error when invite fails', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: { available: true }, error: null }
      }
      if (fn === 'create_employee_record') {
        return { data: { success: true }, error: null }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock({
      inviteUserByEmail: vi.fn(async () => ({
        data: null,
        error: { message: 'invite failed' },
      })),
    })

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'employee',
    })

    expect(result.status).toBe('error')
    expect(result.message).toBe('Invite could not be sent. Please try again.')
  })

  it('returns error when invite returns no user id', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: { available: true }, error: null }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock({
      inviteUserByEmail: vi.fn(async () => ({
        data: { user: null },
        error: null,
      })),
    })

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'employee',
    })

    expect(result.status).toBe('error')
    expect(result.message).toBe('Invite failed to return a user ID. Please try again.')
  })

  it('cleans up user when employee record fails', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: { available: true }, error: null }
      }
      if (fn === 'create_employee_record') {
        return { data: { success: false, error: 'db failed' }, error: null }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock()

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'employee',
    })

    expect(result.status).toBe('error')
    expect(result.message).toBe(
      'Invite failed while creating the employee record. Please try again.'
    )
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-1')
  })

  it('returns success and passes redirect url on happy path', async () => {
    const supabase = createSupabaseMock((fn) => {
      if (fn === 'check_email_available') {
        return { data: { available: true }, error: null }
      }
      if (fn === 'create_employee_record') {
        return { data: { success: true }, error: null }
      }
      return { data: null, error: null }
    })
    const adminClient = createAdminClientMock()

    const result = await performEmployeeInvite({
      supabase,
      adminClient,
      siteUrl: 'https://app.test',
      createdBy: 'admin-1',
      email: 'user@test.com',
      name: 'User',
      role: 'admin',
    })

    expect(result.status).toBe('success')
    expect(result.message).toBe('Invite sent to user@test.com.')
    expect(adminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.objectContaining({
        redirectTo: 'https://app.test/auth/confirm?next=%2Flogin',
      })
    )
  })
})
