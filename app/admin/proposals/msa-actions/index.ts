// ============================================================
// Re-exports for backward compatibility
// All existing imports from '@/app/admin/proposals/msa-actions'
// will continue to work.
// ============================================================

// Types
export type { MSAContent, CreateMSAInput, SendMSAInput, SignMSAInput } from './types'

// CRUD operations
export { createMSA, updateMSA, getMSA, hasSignedMSA } from './crud'

// Signing workflow
export { sendMSA, signMSA } from './signing'

// Helpers (internal, but exported for potential use)
export { generatePortalToken } from './helpers'
