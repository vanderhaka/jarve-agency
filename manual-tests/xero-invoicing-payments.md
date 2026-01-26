# Manual Testing Checklist — Xero Invoicing & Payments

**Feature:** Xero integration (invoices + payments)
**Date:** __________
**Tester:** __________
**Environment:** __________

## Prerequisites

### Environment Setup
- [ ] XERO_CLIENT_ID configured in environment
- [ ] XERO_CLIENT_SECRET configured in environment
- [ ] STRIPE_SECRET_KEY configured in environment
- [ ] STRIPE_WEBHOOK_SECRET configured in environment
- [ ] Supabase migration applied (20260124000001_stage_5_xero_stripe.sql)
- [ ] Storage bucket "contract-docs" exists

### Test Data
- [ ] At least one client exists in CRM
- [ ] At least one project exists with a client assigned

---

## 1. Xero Connection (Settings Page)

**Path:** Admin > Settings

### Connect to Xero
- [ ] Navigate to Settings page
- [ ] Locate "Xero Integration" card
- [ ] **Expected:** Shows "Not Connected" status
- [ ] Click "Connect Xero" button
- [ ] **Expected:** Redirects to Xero login/authorize page
- [ ] Complete Xero OAuth flow
- [ ] **Expected:** Redirected back to Settings with success message
- [ ] **Expected:** Card now shows "Connected" with tenant name
- [ ] **Expected:** Connection date is displayed

### Disconnect from Xero
- [ ] Click "Disconnect" button
- [ ] **Expected:** Connection is removed
- [ ] **Expected:** Card shows "Not Connected" again

---

## 2. Create Invoice (Project Finance Tab)

**Path:** Admin > Projects > [Project] > Finance tab

### Navigate to Finance Tab
- [ ] Open a project with a client assigned
- [ ] Click "Finance" tab
- [ ] **Expected:** Finance tab loads with invoice summary cards
- [ ] **Expected:** "Create Invoice" button is visible

### Create Draft Invoice
- [ ] Click "Create Invoice" button
- [ ] **Expected:** Invoice creation dialog opens
- [ ] Add line item: Description = "Web Design", Qty = 1, Unit Price = 1000
- [ ] Add another line item: Description = "Development", Qty = 10, Unit Price = 150
- [ ] **Expected:** Subtotal shows $2,500.00
- [ ] **Expected:** GST shows $250.00
- [ ] **Expected:** Total shows $2,750.00
- [ ] Click "Create Draft Invoice"
- [ ] **Expected:** Dialog closes
- [ ] **Expected:** New invoice appears in the list with DRAFT status
- [ ] **Expected:** Invoice number is generated (e.g., INV-0001)

### Verify Xero Sync (if connected)
- [ ] Check Xero dashboard
- [ ] **Expected:** Invoice appears as Draft in Xero
- [ ] **Expected:** Line items match
- [ ] **Expected:** Tax type is "GST on Income" (OUTPUT)
- [ ] **Expected:** Amounts are tax exclusive

---

## 3. Invoice Detail Page

**Path:** Admin > Projects > [Project] > Finance > [Invoice]

- [ ] Click on an invoice number in the list
- [ ] **Expected:** Invoice detail page opens
- [ ] **Expected:** Shows invoice number and status badge
- [ ] **Expected:** Shows client name and project link
- [ ] **Expected:** Shows issue date and due date
- [ ] **Expected:** Shows line items table
- [ ] **Expected:** Shows subtotal, GST, and total
- [ ] **Expected:** "Sync from Xero" button is visible
- [ ] **Expected:** "Mark Paid" button is visible (if not paid)

---

## 4. Status Sync from Xero

### In Xero: Change invoice status
- [ ] Log into Xero dashboard
- [ ] Change invoice status to "Awaiting Payment" (Authorise it)

### In CRM: Sync status
- [ ] Open the invoice detail page
- [ ] Click "Sync from Xero" button
- [ ] **Expected:** Status updates to "AUTHORISED"
- [ ] **Expected:** "Last synced" timestamp updates

### PDF Sync (for AUTHORISED/PAID invoices)
- [ ] After syncing a non-DRAFT invoice
- [ ] **Expected:** PDF is fetched and stored in storage bucket
- [ ] **Expected:** Entry created in contract_docs table
- [ ] **Verify:** Check Supabase storage for PDF file
- [ ] **Verify:** Check contract_docs table for entry with doc_type='invoice'

---

## 5. Manual Mark Paid

**Path:** Invoice detail page or Finance tab

- [ ] Find an invoice with status AUTHORISED
- [ ] Click "Mark Paid" button ($ icon)
- [ ] **Expected:** Confirmation dialog shows invoice details
- [ ] Click "Mark Paid" in dialog
- [ ] **Expected:** Status changes to PAID
- [ ] **Expected:** "Paid X ago" indicator appears

### Verify Xero Sync
- [ ] Check Xero dashboard
- [ ] **Expected:** Payment recorded against invoice
- [ ] **Expected:** Invoice shows as "Paid" in Xero

---

## 6. Stripe Webhook Payment Flow

### Setup Stripe CLI (Local Testing)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
- [ ] Stripe CLI running and forwarding webhooks

### Create Test Payment
- [ ] Create a checkout session via Stripe API or dashboard
- [ ] Include metadata: `invoice_id: [your-invoice-uuid]`
- [ ] Complete payment with test card (4242 4242 4242 4242)

### Verify Webhook Processing
- [ ] **Expected:** Webhook received in CLI output
- [ ] **Expected:** Invoice status updates to PAID in CRM
- [ ] **Expected:** Payment record created in payments table
- [ ] **Expected:** Payment posted to Xero (if connected)

---

## 7. Search Integration

**Path:** Global search (Cmd+K or search bar)

- [ ] Create an invoice with a known number (e.g., INV-0042)
- [ ] Open global search
- [ ] Type the invoice number
- [ ] **Expected:** Invoice appears in search results
- [ ] **Expected:** Shows invoice number and client name
- [ ] Click on invoice result
- [ ] **Expected:** Navigates to invoice detail page

---

## 8. Edge Cases

### Project without client
- [ ] Open a project with no client assigned
- [ ] Navigate to Finance tab
- [ ] **Expected:** Warning message about no client
- [ ] **Expected:** "Create Invoice" button is disabled

### Invoice without Xero connection
- [ ] Disconnect from Xero
- [ ] Create a new invoice
- [ ] **Expected:** Invoice created locally with DRAFT status
- [ ] **Expected:** No error about Xero
- [ ] **Expected:** xero_invoice_id is null

### Sync when not connected to Xero
- [ ] With Xero disconnected, click "Sync from Xero"
- [ ] **Expected:** Appropriate error message

---

## Sign-off

- [ ] All critical paths tested
- [ ] No blocking bugs found
- [ ] Ready for production

**Tester signature:** __________
**Date:** __________
