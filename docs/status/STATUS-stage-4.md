# Stage 4 Status - Client Portal

**Last Updated:** 2026-01-24
**Status:** IN PROGRESS

## Overview

Stage 4 implements the full client portal with chat, docs vault, and file uploads.

## Completed Items

### Database
- [x] Created `portal_messages` table for chat messages
- [x] Created `client_uploads` table for file uploads
- [x] Created `portal_read_state` table for unread tracking
- [x] Added RLS policies for all new tables
- [x] Migration file: `20260124000001_stage_4_client_portal.sql`

### Storage
- [x] Configured `contract-docs` bucket (for contracts/invoices)
- [x] Configured `client-uploads` bucket (for client files)
- [x] Signed URL generation with 1-hour expiry

### Server Actions
- [x] `getPortalManifest(token)` - Validate token, return client/project data
- [x] `getPortalMessages(token, projectId)` - Fetch chat messages
- [x] `postPortalMessage(token, projectId, body)` - Send client message
- [x] `postOwnerMessage(projectId, body, authorId)` - Send admin message
- [x] `updateReadState(token, projectId)` - Track read state
- [x] `updateOwnerReadState(projectId, ownerId)` - Track admin read state
- [x] `getClientUploads(token, projectId)` - List uploads
- [x] `uploadClientFile(token, projectId, formData)` - Upload file
- [x] `getUploadSignedUrl(token, uploadId)` - Get download URL
- [x] `getContractDocs(token, projectId)` - List contract docs
- [x] `getContractDocSignedUrl(token, docId)` - Get contract download URL
- [x] `deleteClientUpload(uploadId)` - Admin delete upload

### Client Portal UI
- [x] `/portal/[token]/layout.tsx` - Token validation layout
- [x] `/portal/[token]/page.tsx` - Portal home with stats and quick actions
- [x] `/portal/[token]/chat/page.tsx` - Chat interface
- [x] `/portal/[token]/docs/page.tsx` - Documents vault
- [x] `/portal/[token]/uploads/page.tsx` - File uploads manager
- [x] Portal context provider for shared state
- [x] Project switcher for multi-project clients
- [x] Responsive navigation

### Admin UI
- [x] Portal tab in client details (`/admin/clients/[id]`)
- [x] Add/manage client portal users
- [x] Generate/revoke portal links
- [x] View link stats (view count, last viewed)
- [x] Chat page in project details (`/admin/projects/[id]/chat`)
- [x] Send messages as owner/admin

### Tests
- [x] Automated tests in `tests/portal.test.ts`
  - Token validation (revoked denies access)
  - Portal manifest includes projects
  - Message posting
  - Read state updates
  - Token creation/revocation
- [x] Manual test checklist updated: `manual-tests/client-portal.md`

## Pending Items

- [ ] Apply migration to production database
- [ ] Create storage buckets in Supabase Dashboard
- [ ] Run full manual test checklist
- [ ] Sign off stage

## Known Issues

None currently.

## Blockers

None currently.

## Files Changed

### New Files
- `supabase/migrations/20260124000001_stage_4_client_portal.sql`
- `lib/integrations/portal/actions.ts`
- `lib/integrations/portal/index.ts`
- `app/portal/[token]/layout.tsx`
- `app/portal/[token]/page.tsx`
- `app/portal/[token]/chat/page.tsx`
- `app/portal/[token]/docs/page.tsx`
- `app/portal/[token]/uploads/page.tsx`
- `app/portal/[token]/components/portal-context.tsx`
- `app/portal/[token]/components/portal-nav.tsx`
- `app/portal/[token]/components/portal-home.tsx`
- `app/portal/[token]/components/chat-interface.tsx`
- `app/portal/[token]/components/docs-vault.tsx`
- `app/portal/[token]/components/uploads-manager.tsx`
- `app/portal/[token]/components/project-switcher.tsx`
- `app/admin/projects/[id]/chat/page.tsx`
- `app/admin/projects/[id]/chat/admin-chat-interface.tsx`
- `components/admin/portal/portal-management.tsx`
- `tests/portal.test.ts`

### Modified Files
- `lib/integrations/portal/types.ts` - Added new types
- `app/admin/clients/[id]/page.tsx` - Added Portal tab
- `app/admin/projects/[id]/project-header.tsx` - Added Chat button
- `manual-tests/client-portal.md` - Updated test checklist

## Next Steps

1. Apply migration via Supabase MCP or Dashboard
2. Create storage buckets in Supabase Dashboard
3. Run `npm run dev` and complete manual testing
4. Fix any issues found during testing
5. Sign off stage and proceed to Stage 5 (Xero/Stripe)
