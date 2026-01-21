export type InviteEmployeeState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

export type EmailAvailabilityResult = {
  available: boolean
  reason?: string | null
}

export type CreateEmployeeRecordResult = {
  success: boolean
  error?: string | null
}

export type InviteSupabaseClient = {
  rpc: <T>(
    fn: string,
    params: Record<string, unknown>
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>
}

export type InviteAdminClient = {
  auth: {
    admin: {
      inviteUserByEmail: (
        email: string,
        options: { data: { name: string }; redirectTo: string }
      ) => Promise<{
        data: { user?: { id?: string | null } | null } | null
        error: { message: string } | null
      }>
      deleteUser: (userId: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

export type InviteValidationResult =
  | {
      ok: true
      email: string
      name: string
      role: 'employee' | 'admin'
    }
  | {
      ok: false
      message: string
    }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateInvitePayload(
  payload: {
    email?: string | null
    name?: string | null
    role?: string | null
  },
  defaultRole: 'employee' | 'admin' = 'employee'
): InviteValidationResult {
  const email = payload.email?.trim().toLowerCase()
  const name = payload.name?.trim()
  const rawRole = payload.role?.trim()
  const role = rawRole ? rawRole : defaultRole

  if (!email || !name) {
    return {
      ok: false,
      message: 'Please provide a full name and email address.',
    }
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      ok: false,
      message: 'Please provide a valid email address.',
    }
  }

  if (role !== 'employee' && role !== 'admin') {
    return {
      ok: false,
      message: 'Please select a valid role.',
    }
  }

  return {
    ok: true,
    email,
    name,
    role,
  }
}

export function resolveSiteUrlFromHeaders(
  headerValues: Record<string, string | null | undefined>,
  envSiteUrl?: string
): string | null {
  if (envSiteUrl) {
    return envSiteUrl
  }

  const origin = headerValues.origin
  if (origin) {
    return origin
  }

  const host = headerValues['x-forwarded-host'] ?? headerValues.host
  if (!host) {
    return null
  }

  const protocol = headerValues['x-forwarded-proto'] ?? 'https'
  return `${protocol}://${host}`
}

export function buildConfirmRedirectUrl(
  siteUrl: string,
  nextPath = '/login'
): string {
  const redirectUrl = new URL('/auth/confirm', siteUrl)
  redirectUrl.searchParams.set('next', nextPath)
  return redirectUrl.toString()
}

export async function performEmployeeInvite(input: {
  supabase: InviteSupabaseClient
  adminClient: InviteAdminClient
  siteUrl: string
  createdBy: string
  email: string
  name: string
  role: 'employee' | 'admin'
}): Promise<InviteEmployeeState> {
  const { supabase, adminClient, siteUrl, createdBy, email, name, role } = input

  const { data: emailCheck, error: emailCheckError } = await supabase.rpc<EmailAvailabilityResult>(
    'check_email_available',
    { p_email: email }
  )
  if (emailCheckError) {
    console.error('[inviteEmployee] Email check error:', emailCheckError)
    return {
      status: 'error',
      message: 'Unable to validate the email right now. Please try again.',
    }
  }
  if (!emailCheck) {
    return {
      status: 'error',
      message: 'Email validation failed. Please try again.',
    }
  }
  if (!emailCheck.available) {
    return {
      status: 'error',
      message: emailCheck.reason || 'That email is already in use.',
    }
  }

  const redirectUrl = buildConfirmRedirectUrl(siteUrl, '/login')

  const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { name },
      redirectTo: redirectUrl,
    }
  )

  if (error) {
    console.error('[inviteEmployee] Auth invite error:', error)
    return {
      status: 'error',
      message: 'Invite could not be sent. Please try again.',
    }
  }

  const newUserId = inviteData?.user?.id
  if (!newUserId) {
    console.error('[inviteEmployee] No user ID returned from invite')
    return {
      status: 'error',
      message: 'Invite failed to return a user ID. Please try again.',
    }
  }

  const { data: result, error: dbError } = await supabase.rpc<CreateEmployeeRecordResult>(
    'create_employee_record',
    {
      p_user_id: newUserId,
      p_email: email,
      p_name: name,
      p_role: role,
      p_created_by: createdBy,
    }
  )

  if (dbError || (result && !result.success)) {
    console.error('[inviteEmployee] Employee record error:', dbError, result?.error)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(newUserId)
    if (deleteError) {
      console.error('[inviteEmployee] Cleanup delete user error:', deleteError)
    }
    return {
      status: 'error',
      message: 'Invite failed while creating the employee record. Please try again.',
    }
  }

  return {
    status: 'success',
    message: `Invite sent to ${email}.`,
  }
}
