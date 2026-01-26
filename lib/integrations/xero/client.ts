/**
 * Xero API Client
 * Handles OAuth authentication and API calls to Xero
 *
 * Adapted from jarve-website for jarve-agency CRM
 * Full implementation in Stage 5
 */

import { createClient } from '@/utils/supabase/server'

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID?.trim()
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET?.trim()
const XERO_REDIRECT_URI = (process.env.XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL}/api/xero/callback`).trim()

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'
const XERO_API_URL = 'https://api.xero.com/api.xro/2.0'
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections'

export interface XeroTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface XeroTenant {
  id: string
  tenantId: string
  tenantType: string
  tenantName: string
}

export interface XeroInvoice {
  InvoiceID?: string
  InvoiceNumber?: string
  Type: 'ACCREC' | 'ACCPAY'
  Contact: {
    ContactID?: string
    Name: string
    EmailAddress?: string
  }
  DateString?: string
  DueDateString?: string
  Status?: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED' | 'DELETED'
  LineAmountTypes?: 'Exclusive' | 'Inclusive' | 'NoTax'
  LineItems: Array<{
    Description: string
    Quantity: number
    UnitAmount: number
    AccountCode?: string
    TaxType?: string
  }>
  SubTotal?: number
  TotalTax?: number
  Total?: number
  AmountDue?: number
  AmountPaid?: number
  FullyPaidOnDate?: string
  Reference?: string
}

/**
 * Get the Xero OAuth authorization URL
 */
export function getXeroAuthUrl(state: string): string {
  if (!XERO_CLIENT_ID) {
    throw new Error('XERO_CLIENT_ID not configured')
  }

  const scopes = [
    'openid',
    'profile',
    'email',
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings.read',
    'offline_access',
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: XERO_CLIENT_ID,
    redirect_uri: XERO_REDIRECT_URI,
    scope: scopes,
    state,
  })

  return `${XERO_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<XeroTokens | null> {
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    console.error('Xero credentials not configured')
    return null
  }

  try {
    const response = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: XERO_REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to exchange Xero code for tokens', { error })
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error exchanging Xero code', { error })
    return null
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshXeroTokens(refreshToken: string): Promise<XeroTokens | null> {
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    console.error('Xero credentials not configured')
    return null
  }

  try {
    const response = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to refresh Xero tokens', { error })
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error refreshing Xero tokens', { error })
    return null
  }
}

/**
 * Get connected Xero tenants
 */
export async function getXeroTenants(accessToken: string): Promise<XeroTenant[]> {
  try {
    const response = await fetch(XERO_CONNECTIONS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to get Xero tenants')
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting Xero tenants', { error })
    return []
  }
}

/**
 * Get valid access token (refreshes if needed)
 * TODO: Implement xero_connections table in Stage 5
 */
export async function getValidAccessToken(): Promise<{ accessToken: string; tenantId: string } | null> {
  const supabase = await createClient()

  const { data: connection, error } = await supabase
    .from('xero_connections')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error || !connection) {
    console.warn('No active Xero connection found')
    return null
  }

  const now = new Date()
  const expiresAt = new Date(connection.token_expires_at)

  // Token still valid - return it
  if (expiresAt.getTime() - now.getTime() >= 5 * 60 * 1000) {
    return {
      accessToken: connection.access_token,
      tenantId: connection.tenant_id,
    }
  }

  // Token needs refresh
  const newTokens = await refreshXeroTokens(connection.refresh_token)
  if (!newTokens) {
    await supabase
      .from('xero_connections')
      .update({ is_active: false })
      .eq('id', connection.id)
    return null
  }

  const newExpiresAt = new Date(now.getTime() + newTokens.expires_in * 1000)
  await supabase
    .from('xero_connections')
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', connection.id)

  return {
    accessToken: newTokens.access_token,
    tenantId: connection.tenant_id,
  }
}

/**
 * Make authenticated API call to Xero
 */
export async function xeroApiCall<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const credentials = await getValidAccessToken()
  if (!credentials) {
    return { success: false, error: 'Not connected to Xero' }
  }

  try {
    const response = await fetch(`${XERO_API_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'xero-tenant-id': credentials.tenantId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Xero API error', { endpoint, status: response.status, error: errorText })
      return { success: false, error: `Xero API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Xero API call failed', { endpoint, error })
    return { success: false, error: 'Failed to communicate with Xero' }
  }
}

/**
 * Create an invoice in Xero
 */
export async function createXeroInvoice(invoice: XeroInvoice): Promise<{
  success: boolean
  invoiceId?: string
  invoiceNumber?: string
  error?: string
}> {
  const result = await xeroApiCall<{ Invoices: XeroInvoice[] }>('/Invoices', {
    method: 'POST',
    body: { Invoices: [invoice] },
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  const createdInvoice = result.data?.Invoices?.[0]
  if (!createdInvoice?.InvoiceID) {
    return { success: false, error: 'Invoice created but no ID returned' }
  }

  return {
    success: true,
    invoiceId: createdInvoice.InvoiceID,
    invoiceNumber: createdInvoice.InvoiceNumber,
  }
}

/**
 * Get invoice from Xero
 */
export async function getXeroInvoice(invoiceId: string): Promise<XeroInvoice | null> {
  const result = await xeroApiCall<{ Invoices: XeroInvoice[] }>(`/Invoices/${invoiceId}`)
  return result.data?.Invoices?.[0] || null
}
