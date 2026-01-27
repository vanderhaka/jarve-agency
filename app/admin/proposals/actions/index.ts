'use server'

// Re-export all types
export type {
  ProposalSection,
  PricingLineItem,
  ProposalContent,
  CreateProposalInput,
  UpdateProposalInput,
  SendProposalInput,
  SignProposalInput
} from './types'

// Re-export all functions
export { createProposal, archiveProposal, getProposal, listProposals } from './crud'
export { updateProposal } from './versioning'
export { sendProposal } from './email'
export { signProposal } from './signing'
export { convertLeadAndSend } from './conversion'
export { generatePortalToken } from './helpers'
