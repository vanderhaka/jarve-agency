# Manual Testing Checklist — Xero Invoicing & Payments

**Feature:** Xero integration (invoices + payments)
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Xero account connected
- [ ] Client with Xero contact ID
- [ ] Project with milestone

## 1. Create Invoice from Milestone
- [ ] Mark milestone complete
- [ ] **Expected:** Invoice created in Xero
- [ ] **Expected:** Invoice created in Draft status
- [ ] **Expected:** `xero_invoice_id` stored locally

## 2. PDF Sync
- [ ] Open Docs Vault
- [ ] **Expected:** Invoice PDF available

## 3. Status Sync
- [ ] Change invoice status in Xero (e.g., Paid)
- [ ] Run sync
- [ ] **Expected:** CRM status updates

## 4. Manual Mark Paid (Bank Transfer)
- [ ] Mark invoice as paid inside CRM
- [ ] **Expected:** Status updates and audit logged
- [ ] **Expected:** Payment is written back to Xero

## 5. Stripe Payment Flow (Webhooks)
- [ ] Create a Stripe checkout/payment link for an invoice
- [ ] Complete payment in Stripe test mode
- [ ] **Expected:** Webhook marks invoice paid in CRM
- [ ] **Expected:** Payment written back to Xero

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
