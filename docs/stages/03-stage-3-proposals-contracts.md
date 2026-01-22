# Stage 3 - Proposals + Contracts (MSA/SOW)

## Goal
Create and sign proposals that become contracts (SOW). Support one-time MSA per client. Store signed documents in the contract docs vault.

## Preconditions
- Stage 2 complete.

## Scope (In)
- Proposal builder (templated) with draft + versioning.
- Proposal signing in the portal (minimal signing view only).
- Capture signature, IP, and timestamp.
- MSA creation and signing (one per client).
- Contract docs vault entries for signed items.
- Project cannot move to Active until MSA + SOW are signed.
- Add proposals and contract docs to global search results.

## Scope (Out)
- Full portal chat/ uploads (Stage 4).
- Invoicing and payments (Stage 5).

## Data Model Changes
Proposals and versions:
```sql
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES agency_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft, sent, signed, archived
  current_version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  archived_at timestamptz
);

CREATE TABLE proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version int NOT NULL,
  content jsonb NOT NULL, -- sections, pricing, terms
  subtotal numeric,
  gst_rate numeric NOT NULL DEFAULT 0.10,
  gst_amount numeric,
  total numeric,
  pdf_path text,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proposal_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  client_user_id uuid,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signature_svg text NOT NULL,
  ip_address text,
  signed_at timestamptz NOT NULL DEFAULT now()
);
```

Contract docs vault:
```sql
CREATE TABLE contract_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES agency_projects(id) ON DELETE SET NULL,
  doc_type text NOT NULL, -- msa, sow, proposal_version, change_request, invoice
  title text NOT NULL,
  version int,
  file_path text NOT NULL,
  signed_at timestamptz,
  source_table text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Proposal templates (JSON-based):
```sql
CREATE TABLE proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]', -- array of section blocks
  default_terms text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Notes:
- `client_users` and `client_portal_tokens` tables already created in Stage 1.
- Reuse token creation/validation logic from `jarve-website`.
- Tokens do NOT expire (no `expires_at`); use `revoked_at` to disable.
- Seed 1-2 default templates on first deploy.
- Proposal content JSON shape:
  - `sections: [{ id, type: 'text'|'list'|'pricing'|'image', title, body, items, order }]`
  - `pricing: { lineItems: [{ label, qty, unitPrice, total }], subtotal, gstRate, gstAmount, total }`
  - `terms: string`
- PDF generation: HTML → PDF (Chromium) for highest fidelity and consistent rendering.

## Server Actions / API
- `createProposal(leadId|projectId, templateData)` -> creates proposal + version 1.
- `updateProposal(proposalId, content)` -> creates new version and increments version **on every edit**.
- `sendProposal(proposalId, clientUserId, version)` -> marks proposal sent and provides portal link; track which version was sent.
- `signProposal(token, signature)` -> stores signature, locks version, writes SOW to `contract_docs`.
- `createMSA(clientId)` + `signMSA(token, signature)` -> stores MSA in `contract_docs`.

Access link delivery:
- When a client user is created, send the portal access link by email (one-off).
- No ongoing email communication; portal chat is the source of truth.
 - Proposal send triggers the access link email if the client user does not already have one.

## UI Changes
Admin:
- Add "Create Proposal" on lead or project.
- Proposal editor uses a template (sections + pricing blocks).
- Version list view with timestamps.
- "Send to Client" button.
- When sending, pick or create a client user (person) to attach the link to.
  - If the client user has no link, generate it and email it.

Client (portal signing view only):
- Open link -> view proposal -> sign with drawn signature.
- Show IP and timestamp in the signed record.
- Require signer name + signature; capture IP + signed_at.

## Data Flow
- Proposal draft -> sent -> signed.
- Signed proposal becomes SOW and is stored in `contract_docs`.
- MSA is stored once per client.
- Project status cannot move to Active until both are signed.
- Older proposal versions remain read-only for record keeping; only the current version can be signed.
- Multiple versions can be sent; store which version was sent for audit.

## Tests

### Automated
- Unit test: editing proposal creates new version.
- Unit test: sending proposal records which version was sent.
- Unit test: signing locks current version and sets status to signed.
- Unit test: signed proposal creates SOW doc entry.
- Unit test: project status blocked until MSA + SOW exist.

### Manual
- `manual-tests/proposals-contracts.md`

## Known Risks
- PDF generation may fail for large proposals (memory limits)
- Signature capture quality varies by device/browser
- Proposal versioning can create many rows if client requests frequent changes
- MSA "one per client" may not handle client mergers/acquisitions

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE proposal_templates, proposal_signatures, proposal_versions, proposals, contract_docs;`
2. Revert UI changes via git
3. Remove any generated PDFs from storage bucket
4. Re-test client portal signing view

## Done Definition
- Proposal drafts, versions, and signatures work end-to-end.
- MSA can be signed once per client.
- Signed docs appear in contract docs vault.
- Manual checklist signed.
