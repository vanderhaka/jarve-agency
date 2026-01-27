/**
 * Portal Actions
 * Server actions for client portal functionality (Stage 4)
 *
 * Handles:
 * - Token validation and manifest retrieval
 * - Chat messages (portal_messages)
 * - File uploads (client_uploads)
 * - Read state tracking (portal_read_state)
 *
 * This barrel file re-exports all portal actions for backward compatibility.
 */

// Manifest
export { getPortalManifest } from './manifest'

// Messages
export {
  getPortalMessages,
  postPortalMessage,
  postOwnerMessage,
  updateReadState,
  updateOwnerReadState,
} from './messages'

// Uploads
export {
  getClientUploads,
  uploadClientFile,
  getUploadSignedUrl,
  deleteClientUpload,
} from './uploads'

// Documents
export { getContractDocs, getContractDocSignedUrl } from './documents'

// Token validation (internal helpers, exported for advanced use cases)
export { validateTokenForProject, validateTokenForClient } from './tokens'
export type { TokenValidationResult } from './tokens'
