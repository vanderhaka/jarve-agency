/**
 * Client Portal Module
 * Export all portal-related functionality
 */

// Types
export * from './types'

// Token management actions (from client.ts)
export {
  createClientPortalToken,
  revokeClientPortalToken,
  getClientPortalStatus,
} from './client'

// Portal actions (from actions.ts)
export {
  getPortalManifest,
  getPortalMessages,
  postPortalMessage,
  postOwnerMessage,
  updateReadState,
  updateOwnerReadState,
  getClientUploads,
  uploadClientFile,
  getUploadSignedUrl,
  getContractDocs,
  getContractDocSignedUrl,
  deleteClientUpload,
} from './actions'
