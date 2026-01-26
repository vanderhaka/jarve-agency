# Stage 3 Status: Proposals + Contracts (MSA/SOW)

## Current Status: READY FOR MANUAL TESTING

## Summary
Implementing proposal workflow with versioning, client portal signing, MSA management, and contract document vault.

## Completed Tasks

### Database Migration
- [x] Created `proposal_templates` table with default template seeding
- [x] Created `proposals` table with lead/client/project references
- [x] Created `proposal_versions` table with versioning support
- [x] Created `proposal_signatures` table with IP/timestamp capture
- [x] Created `contract_docs` table for signed document vault
- [x] Created `client_msas` table (one per client pattern)
- [x] Added RLS policies for all new tables
- [x] Added `is_active_employee()` helper function

### Server Actions
- [x] `createProposal` - creates proposal with initial version from template
- [x] `updateProposal` - creates new version on every edit
- [x] `sendProposal` - marks version sent, generates portal link
- [x] `signProposal` - captures signature, creates SOW entry
- [x] `archiveProposal` - soft archive proposal
- [x] `getProposal` - fetch with versions and signatures
- [x] `listProposals` - list with filters
- [x] `createMSA` - create MSA for client
- [x] `updateMSA` - update MSA content
- [x] `sendMSA` - send for client signing
- [x] `signMSA` - capture signature, create contract doc entry
- [x] `getMSA` - fetch MSA for client
- [x] `hasSignedMSA` - check if client has signed MSA
- [x] Template CRUD actions (list, get, create, update, delete, setDefault)

### UI Components
- [x] Proposals list page with tabs (Proposals / Templates)
- [x] New proposal page with template selection
- [x] Proposal detail/editor page with sections and pricing
- [x] Version history tab
- [x] Send to client dialog with client user selection
- [x] Signature capture component (canvas-based, SVG output)
- [x] Client portal proposal signing view
- [x] Client portal MSA signing view
- [x] Contract docs list component
- [x] Client MSA card component
- [x] Added Contracts tab to client detail page

### Business Logic
- [x] Project status gate - blocks Active without signed MSA + SOW
- [x] `checkProjectContractStatus` - check contract requirements
- [x] `updateProjectStatus` - enforce gate on status change

### Search Integration
- [x] Added proposals to global search
- [x] Added contract docs to global search
- [x] Updated command palette with new icons/labels

### Testing
- [x] Unit tests for pricing calculations
- [x] Unit tests for signature validation
- [x] Unit tests for proposal status/permissions
- [x] Unit tests for versioning logic

## Pending Tasks

### Before Sign-off
- [ ] Apply database migration to Supabase
- [ ] Test proposal creation end-to-end
- [ ] Test proposal versioning (edit creates new version)
- [ ] Test proposal sending to client
- [ ] Test client portal signing flow
- [ ] Test MSA creation and signing
- [ ] Test contract docs vault displays correctly
- [ ] Test project status gate enforcement
- [ ] Test global search for proposals/contracts
- [ ] Manual test checklist completion

## Files Created/Modified

### New Files
- `supabase/migrations/20260124000001_stage_3_proposals_contracts.sql`
- `app/admin/proposals/actions.ts`
- `app/admin/proposals/msa-actions.ts`
- `app/admin/proposals/template-actions.ts`
- `app/admin/proposals/page.tsx`
- `app/admin/proposals/new/page.tsx`
- `app/admin/proposals/[id]/page.tsx`
- `app/portal/proposal/[id]/page.tsx`
- `app/portal/msa/[id]/page.tsx`
- `components/signature-capture.tsx`
- `components/contract-docs-list.tsx`
- `components/client-msa-card.tsx`
- `tests/proposals.test.ts`
- `docs/status/STATUS-stage-3.md`
- `manual-tests/proposals-contracts.md`

### Modified Files
- `app/admin/projects/[id]/actions.ts` - added contract gate actions
- `app/admin/clients/[id]/page.tsx` - added Contracts tab
- `app/api/search/route.ts` - added proposals/contracts search
- `components/search/command-palette.tsx` - added new types

## Known Issues
- PDF generation not implemented (placeholder file_path)
- Email sending not implemented (returns portal URL only)

## Test Results
- **Unit Tests:** 53 passed (28 proposals + others)
- **TypeScript:** Clean (no errors)
- **Lint:** 20 warnings, 5 errors (pre-existing, not from stage 3)

## Dependencies
- Stage 2 complete (agency settings)
- `client_users` and `client_portal_tokens` from Stage 1

## Rollback Procedure
If this stage fails:
1. Drop tables: `DROP TABLE IF EXISTS proposal_templates, proposal_signatures, proposal_versions, proposals, contract_docs, client_msas CASCADE;`
2. Drop function: `DROP FUNCTION IF EXISTS is_active_employee;`
3. Revert file changes via git
4. Remove any generated PDFs from storage bucket
