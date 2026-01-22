/**
 * Client Portal Types
 * Types for the client portal system
 *
 * Adapted from jarve-website for jarve-agency CRM
 * Full implementation in Stage 4
 */

/**
 * A client portal token that grants access to project info
 */
export interface ClientPortalToken {
  id: string
  client_user_id: string
  token: string
  created_at: string
  revoked_at: string | null
  last_viewed_at: string | null
  view_count: number
}

/**
 * Result of creating a client portal token
 */
export interface CreateClientPortalTokenResult {
  success: true
  token: ClientPortalToken
  url: string
}

/**
 * Error result from client portal operations
 */
export interface ClientPortalErrorResult {
  success: false
  error: string
}

/**
 * Client portal status for display in admin UI
 */
export interface ClientPortalStatus {
  hasActiveToken: boolean
  token: ClientPortalToken | null
  url: string | null
  viewCount: number
  lastViewedAt: string | null
}

/**
 * Project status in the client portal
 */
export type ProjectStatus =
  | 'proposal_pending'
  | 'proposal_accepted'
  | 'proposal_declined'
  | 'project_active'
  | 'project_completed'
