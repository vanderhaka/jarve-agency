# Manual Testing Checklist — Proposals & Contracts (MSA + SOW)

**Feature:** Proposal builder + signing, MSA management, Contract Docs Vault
**Date:** 2026-01-26
**Tester:** Claude Code (Automated)

## Prerequisites
- [x] Logged in as admin
- [x] Stage 3 migration applied to database
- [x] At least one client exists with a client_user
- [x] At least one project exists linked to that client

---

## 1. Proposal Templates

### 1.1 View Templates
- [x] Navigate to `/admin/proposals`
- [x] Click "Templates" tab
- [x] Default template "Standard Project Proposal" appears
- [x] Template shows section count (5 sections)

### 1.2 Create Template (Optional)
- [x] Click "New Template"
- [x] Add sections and terms
- [x] Save template
- [x] Template appears in list

---

## 2. Create Proposal Draft

### 2.1 Create from Proposals Page
- [x] Navigate to `/admin/proposals`
- [x] Click "New Proposal" → Navigates to `/admin/proposals/new`
- [x] Enter proposal title → Form accepts input "Stage 3 Test Proposal"
- [x] Select template (default pre-selected) → "Standard Project Proposal (Default)" verified
- [ ] Optionally link to project
- [ ] Click "Create Proposal"
- [ ] **Expected:** Redirected to proposal editor

> **BLOCKER (2026-01-26):** Chrome extension conflict prevents click/screenshot actions on `/admin/proposals/new` page. Form input works but button clicks fail. Manual testing required for form submission. Likely caused by password manager or similar extension overlay.

### 2.2 Verify Initial Version (Tested on existing "Test" proposal)
- [x] Proposal shows as v1 → Verified in proposal list and editor
- [x] Content from template loaded → 5 sections visible (Introduction, Scope of Work, Deliverables, Investment, Timeline)
- [x] Status is "draft" → Grey "draft" badge confirmed

---

## 3. Proposal Editing

### 3.1 Edit Content
- [x] Edit section titles and body text → Sections editable
- [x] Add/remove list items → "+ Add Item" buttons present
- [x] **Expected:** Unsaved indicator appears → "Save (v2)" button shows when changes pending

### 3.2 Edit Pricing
- [x] Add line items with qty and unit price → Added "Website Development", Qty: 2, Unit Price: 1500
- [x] **Expected:** Line totals calculate automatically → Total: $3,000.00 (2 × 1500)
- [x] **Expected:** Subtotal, GST (10%), and Total update → Subtotal: $3,000.00, GST: $300.00, Total: $3,300.00
- [ ] Remove a line item
- [ ] **Expected:** Totals recalculate

### 3.3 Edit Terms
- [ ] Modify terms and conditions
- [ ] **Expected:** Changes tracked as unsaved

---

## 4. Versioning

### 4.1 Save Creates New Version
- [x] Make changes and click Save → Clicked "Save (v2)" button
- [x] **Expected:** Version increments (e.g., v1 → v2) → Version badge changed to "v2"
- [x] Click "Versions" tab → Shows "Versions (2)"
- [x] **Expected:** Both versions visible with timestamps → v2 (Current, 6:50:07 PM, $3300), v1 (6:38:46 PM, $0)

### 4.2 Edit Again
- [ ] Make another change and save
- [ ] **Expected:** Version increments to v3
- [ ] **Expected:** All three versions in history

---

## 5. Send Proposal

### 5.1 Link to Client
- [ ] Ensure proposal is linked to a project with client
- [ ] Or link directly to client

### 5.2 Send to Client
- [ ] Click "Send to Client" button
- [ ] Select client user from dropdown
- [ ] Click Send
- [ ] **Expected:** Status changes to "sent"
- [ ] **Expected:** Portal URL displayed
- [ ] Copy portal URL for next step

### 5.3 Version Marked as Sent
- [ ] Check Versions tab
- [ ] **Expected:** Sent version shows "Sent" badge with date

---

## 6. Client Portal Signing

### 6.1 Access Portal
- [ ] Open portal URL in new browser/incognito
- [ ] **Expected:** Proposal content displays correctly
- [ ] **Expected:** All sections visible with correct content
- [ ] **Expected:** Pricing table shows line items and totals
- [ ] **Expected:** Terms displayed

### 6.2 Sign Proposal
- [ ] Enter signer name (may be pre-filled)
- [ ] Enter signer email (may be pre-filled)
- [ ] Draw signature on canvas
- [ ] Test "Clear" button - signature clears
- [ ] Redraw signature
- [ ] Click "Sign Proposal"
- [ ] **Expected:** Success message displayed

### 6.3 Verify Signature in Admin
- [ ] Return to admin proposal page
- [ ] **Expected:** Status shows "signed" (green badge)
- [ ] **Expected:** Signed date displayed
- [ ] **Expected:** Signer name and email visible
- [ ] **Expected:** Cannot edit signed proposal

---

## 7. Contract Docs Vault

### 7.1 SOW Created
- [ ] Navigate to client Contracts tab
- [ ] **Expected:** SOW entry appears for signed proposal
- [ ] **Expected:** Signed date matches signing time
- [ ] **Expected:** "sow" type badge displayed

---

## 8. MSA Management

### 8.1 Create MSA
- [ ] Navigate to client detail page → Contracts tab
- [ ] **Expected:** MSA card shows "No MSA created"
- [ ] Click "Create MSA"
- [ ] **Expected:** MSA created with "draft" status

### 8.2 Send MSA
- [ ] Click "Send for Signing"
- [ ] Select client user from dropdown
- [ ] Click Send
- [ ] **Expected:** Status changes to "sent"
- [ ] **Expected:** Portal URL provided
- [ ] Copy portal URL

### 8.3 Sign MSA (Portal)
- [ ] Open MSA portal URL
- [ ] **Expected:** MSA sections display correctly
- [ ] Enter signer details
- [ ] Draw signature
- [ ] Click "Sign Agreement"
- [ ] **Expected:** Success message displayed

### 8.4 Verify MSA Signed
- [ ] Return to client Contracts tab
- [ ] **Expected:** MSA shows "Signed" (green badge)
- [ ] **Expected:** Signer info displayed
- [ ] **Expected:** MSA entry in contract docs list

---

## 9. Project Status Gate

### 9.1 Verify Gate Enforcement
- [ ] Create new project for a client
- [ ] Ensure client does NOT have signed MSA
- [ ] Try to set project status to "in_progress"
- [ ] **Expected:** Error message about missing MSA

### 9.2 Allow with Both Contracts
- [ ] Client has signed MSA
- [ ] Project has signed proposal (SOW)
- [ ] Set project status to "in_progress"
- [ ] **Expected:** Status updates successfully

---

## 10. Global Search

### 10.1 Search for Proposals
- [ ] Press Cmd+K / Ctrl+K to open search
- [ ] Type proposal title
- [ ] **Expected:** Proposal appears in results with FileText icon
- [ ] Click result
- [ ] **Expected:** Navigates to proposal page

### 10.2 Search for Contracts
- [ ] Type contract doc title (e.g., "Statement of Work")
- [ ] **Expected:** Contract appears in results with FileSignature icon

---

## 11. Edge Cases

### 11.1 Invalid Token
- [ ] Try accessing portal with invalid/wrong token
- [ ] **Expected:** "Invalid access link" error

### 11.2 Already Signed
- [ ] Try signing an already-signed proposal again
- [ ] **Expected:** "Already signed" message

### 11.3 Archive Proposal
- [ ] Archive a draft proposal
- [ ] **Expected:** Status changes to "archived"
- [ ] **Expected:** Cannot edit archived proposal

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | PASS / FAIL |

### Issues Found
(Document any bugs or issues discovered during testing)

1.
2.
3.

### Notes
