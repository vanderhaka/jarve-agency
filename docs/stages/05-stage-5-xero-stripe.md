# Stage 5 - Xero Integration (Invoices + Payments)

## Goal
Make Xero the source of truth for invoices and payments. Create Draft invoices from the CRM, sync status + PDFs, and record Stripe payments back to Xero.

## Preconditions
- Stage 4 complete (portal + docs vault).

## Scope (In)
- Xero OAuth connection and tenant selection.
- Create invoices in Xero with Draft status.
- GST 10%, tax exclusive.
- Sync invoice status and PDF to `contract_docs`.
- Manual "Mark Paid" that writes a payment to Xero.
- Stripe webhook flow copied from `jarve-website`.
- Add invoices to global search results.
- Environment keys set via Vercel CLI (no manual copy/paste).

## Scope (Out)
- Automated milestone invoicing (Stage 6).

## Data Model Changes
Xero settings + mappings:
```sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS xero_contact_id text;

CREATE TABLE xero_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text,
  connected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Invoices:
```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES agency_projects(id) ON DELETE SET NULL,
  xero_invoice_id text,
  xero_status text,
  invoice_number text,
  currency text NOT NULL DEFAULT 'AUD',
  subtotal numeric,
  gst_rate numeric NOT NULL DEFAULT 0.10,
  gst_amount numeric,
  total numeric,
  issue_date date,
  due_date date,
  paid_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  amount numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
```

Payments:
```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  method text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Integrations (Reuse)
Copy these from `/Users/jamesvanderhaak/Desktop/Development/jarve-website`:
- `lib/xero/client.ts`
- `app/actions/invoices/xero-sync.ts`
- `app/api/xero/connect/route.ts`
- `app/api/xero/callback/route.ts`
- `app/api/webhooks/xero/route.ts`
- `lib/stripe/client.ts`
- `app/api/webhooks/stripe/route.ts`

Adjustments:
- Xero invoice creation must be Draft + tax exclusive.
- Stripe webhook must write payments back to Xero.
- No email sending.

## Server Actions / API
- `connectXero()` -> OAuth flow.
- `syncXeroInvoices()` -> pulls statuses and PDFs.
- `createXeroInvoice(payload)` -> Draft invoice with GST exclusive.
- `markInvoicePaid(invoiceId, amount, date)` -> posts payment to Xero.

## UI Changes
- Add "Xero Connection" section in settings.
- Project finance tab: list invoices, status, due date.
- Buttons: "Create Draft Invoice", "Mark Paid".

## Data Flow
- CRM invoice draft -> Xero Draft invoice (due date = issue date by default) -> status sync -> PDF stored in `contract_docs`.
- Stripe payment -> webhook -> Xero payment -> local status updated.

## Tests

### Automated
- Unit test: create draft invoice payload is tax exclusive.
- Unit test: Stripe webhook posts payment to Xero (mock).
- Unit test: sync stores PDF and creates `contract_docs` entry.

### Manual
- `manual-tests/xero-invoicing-payments.md`

## Known Risks
- Xero OAuth tokens expire (30 min access, 60 day refresh) - need refresh logic
- Xero API rate limits (60 calls/min) - batch operations carefully
- Stripe webhook delivery failures can cause missed payments
- PDF fetch from Xero may timeout for large invoices
- Currency mismatch between Xero and local settings

## Rollback Procedure
If this stage fails:
1. Disconnect Xero OAuth (revoke token)
2. Migration rollback: `DROP TABLE payments, invoice_line_items, invoices, xero_settings; ALTER TABLE clients DROP COLUMN xero_contact_id;`
3. Remove Stripe webhook endpoint from Stripe dashboard
4. Revert copied integration files
5. Remove invoice PDFs from storage bucket

**Note:** If invoices already created in Xero, they remain there (manual cleanup required).

## Done Definition
- Xero connected and invoices sync correctly.
- Stripe payments write back to Xero.
- Contract docs show invoice PDFs.
- Manual checklist signed.
