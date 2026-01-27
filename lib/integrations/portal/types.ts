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

/**
 * Portal message (chat)
 */
export interface PortalMessage {
  id: string
  project_id: string
  author_type: 'owner' | 'client'
  author_id: string | null
  body: string
  created_at: string
}

/**
 * Client upload (file)
 */
export interface ClientUpload {
  id: string
  project_id: string
  uploaded_by_type: 'owner' | 'client'
  uploaded_by_id: string | null
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

/**
 * Portal read state for tracking unread messages
 */
export interface PortalReadState {
  id: string
  project_id: string
  user_type: 'owner' | 'client'
  user_id: string | null
  last_read_at: string | null
}

/**
 * Project summary for portal manifest
 */
export interface PortalProject {
  id: string
  name: string
  status: string
  created_at: string
  unread_count: number
}

/**
 * Client information for portal
 */
export interface PortalClient {
  id: string
  name: string
  company: string | null
}

/**
 * Full portal manifest returned after token validation
 */
export interface PortalManifest {
  clientUser: {
    id: string
    name: string
    email: string
  }
  client: PortalClient
  projects: PortalProject[]
}

/**
 * Contract document for docs vault
 */
export interface ContractDoc {
  id: string
  project_id: string | null
  client_id: string | null
  title: string
  doc_type: 'msa' | 'sow' | 'proposal' | 'contract' | 'invoice' | 'signed'
  file_path: string | null
  created_at: string
  signed_at: string | null
}
