# Stage 4 - Client Portal (Chat + Uploads + Docs Vault)

## Goal
Turn the signing view into a full portal: one chat thread per project, contract docs vault, and client uploads.

## Preconditions
- Stage 3 complete (portal tokens + signing view exist).
- `client_users` and `client_portal_tokens` tables created in Stage 1.

## Scope (In)
- Full client portal home page.
- One shared chat thread per project (single source of truth).
- Contract docs vault list and download.
- Client uploads area (project files, not contracts).
- Internal notification on new chat message (no external webhook).
- Link revocation and regeneration.

## Scope (Out)
- Email notifications (not used), except one-off access link emails.

## Data Model Changes
Portal chat:
```sql
CREATE TABLE portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  author_type text NOT NULL, -- owner, client
  author_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Uploads:
```sql
CREATE TABLE client_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  uploaded_by_type text NOT NULL, -- owner, client
  uploaded_by_id uuid,
  file_name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Read tracking (required):
```sql
CREATE TABLE portal_read_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  user_type text NOT NULL, -- owner, client
  user_id uuid,
  last_read_at timestamptz
);
```

## Storage
- `contract-docs` bucket for contracts/invoices (from Stage 3/5).
- `client-uploads` bucket for client files.
- Signed URL expiry: 1 hour (regenerate on each request).
- Clients can download; admins can delete stored files.

## Server Actions / API
- `getPortalManifest(token)` (reuse from `jarve-website`, include project list).
- `postPortalMessage(token, projectId, body)` -> inserts message and triggers internal notification/timeline entry (no external webhook).
- `uploadClientFile(token, projectId, file)` -> stores in bucket + `client_uploads` (pdf/docx/jpg/png, max 50MB).
- `revokePortalLink(clientUserId)` -> sets `revoked_at` and generates new token (one active token per client user).

## UI Changes
Client portal:
- Home: project summary + latest messages.
- Docs: list `contract_docs` only (contracts, invoices, signed docs).
  - Show client-level MSA docs on all projects.
- Chat: single thread per project, newest last.
- Uploads: list + upload button.
 - Project switcher if the client has multiple projects.

Admin:
- View portal link per client user.
- Revoke and regenerate link.
- Show portal chat in admin UI (owner/admin only).

## Data Flow
- Portal link -> token -> client user -> their client + projects.
- Chat is the source of truth for all client comms (per project).
- Documents listed in portal come from `contract_docs`.
- Uploads are stored separately and never mixed with contract docs.
- Portal read state tracks unread messages per project per user.

## Tests

### Automated
- Unit test: revoked token denies access.
- Unit test: posting a chat message triggers internal notification/timeline entry.
- Unit test: portal manifest includes all projects for the client user.
- Unit test: read state updates on message view and drives unread counts.

### Manual
- `manual-tests/client-portal.md`

## Known Risks
- Chat messages stored unencrypted - sensitive info may be visible
- File uploads without virus scanning could introduce malware (MVP choice)
- Internal notification failures may cause missed alerts
- Storage bucket permissions must be carefully configured

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE portal_read_state, client_uploads, portal_messages;`
2. Remove storage buckets (or leave empty)
3. Revert UI changes via git
4. Portal tokens from Stage 1 remain intact

## Done Definition
- Client can access portal with a non-expiring link.
- Chat, docs, and uploads work end-to-end.
- Link revocation blocks access.
- Manual checklist signed.
