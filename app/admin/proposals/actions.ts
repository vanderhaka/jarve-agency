// ============================================================
// Backward Compatibility Re-exports
// ============================================================
// This file re-exports all functions and types from the new
// modular structure at ./actions/ for backward compatibility.
// New code should import directly from './actions' or specific
// submodules like './actions/crud', './actions/signing', etc.
// ============================================================

// Re-export all types
export type {
  ProposalSection,
  PricingLineItem,
  ProposalContent,
  CreateProposalInput,
  UpdateProposalInput,
  SendProposalInput,
  SignProposalInput
} from './actions/types'

// Re-export all functions
export { createProposal, archiveProposal, getProposal, listProposals } from './actions/crud'
export { updateProposal } from './actions/versioning'
export { sendProposal } from './actions/email'
export { signProposal } from './actions/signing'
export { convertLeadAndSend } from './actions/conversion'
export { generatePortalToken } from './actions/helpers'
