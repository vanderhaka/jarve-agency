# Stage 6 - Milestones + Change Requests

## Goal
Manage project billing through milestones and approved change requests. Auto-create Draft invoices when milestones complete.

## Preconditions
- Stage 5 complete (Xero + invoices working).

## Scope (In)
- Milestones per project (ordered list).
- Default deposit milestone (50% unless overridden).
- Auto-create a **Draft** deposit invoice when the project is created.
- Auto invoice when a milestone is marked complete.
- Change requests with client signature (portal) and new milestone creation.
- Charge for extras through change requests.
- Add milestones and change requests to global search results.
- GST 10% applied to all milestone and change request amounts.

## Scope (Out)
- Advanced reporting.

## Data Model Changes
Milestones:
```sql
CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL,
  gst_rate numeric NOT NULL DEFAULT 0.10,
  due_date date,
  status text NOT NULL DEFAULT 'planned', -- planned, active, complete, invoiced
  sort_order int NOT NULL DEFAULT 0,
  is_deposit boolean NOT NULL DEFAULT false,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Change requests:
```sql
CREATE TABLE change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft, sent, signed, rejected, archived
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signature_svg text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Server Actions / API
- `createMilestone(projectId, data)` -> inserts milestone.
- `insertMilestone(projectId, data, position)` -> inserts and reorders.
- `completeMilestone(milestoneId)` -> calls `createXeroInvoice`, links invoice.
- `onProjectCreated(projectId)` -> creates deposit milestone + Draft invoice.
- `createChangeRequest(projectId, data)` -> draft request.
- `sendChangeRequest(changeRequestId)` -> portal link for signing.
- `signChangeRequest(token, signature)` -> marks signed, creates milestone, creates invoice.

## UI Changes
- Project "Milestones" tab: list, reorder, add, insert mid-stream.
- Mark milestone complete -> confirm -> invoice created.
- Change request form with price and scope details.
- Client signing view (reuse portal signing pattern).

## Data Flow
- Project created -> auto deposit milestone using default or project override.
- Project created -> Draft deposit invoice created and linked to the deposit milestone (due date = issue date).
- Milestone complete -> Draft invoice created in Xero (non-deposit milestones).
- Change request signed -> new milestone inserted (or appended) -> Draft invoice created.
- Signed change request stored in `contract_docs`.

## Tests

### Automated
- Unit test: deposit milestone uses project override or 50% default.
- Unit test: completing milestone triggers Draft invoice creation.
- Unit test: signed change request creates milestone + invoice.

### Manual
- `manual-tests/milestones.md`
- `manual-tests/change-requests.md`

## Known Risks
- Auto-invoice on milestone completion could create duplicate invoices if clicked twice
- Deposit percentage mismatch between settings and existing projects
- Change request signing may fail if portal token is revoked mid-process
- Reordering milestones after some are invoiced could cause confusion

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE change_requests, milestones;`
2. Manually delete any draft invoices created in Xero during testing
3. Remove milestone-related entries from `contract_docs`
4. Revert UI changes via git

**Note:** Invoices already created in Xero remain there (manual cleanup required).

## Done Definition
- Milestones can be created, reordered, completed.
- Change requests are signed and billed correctly.
- Invoices are created in Xero on completion.
- Manual checklists signed.
